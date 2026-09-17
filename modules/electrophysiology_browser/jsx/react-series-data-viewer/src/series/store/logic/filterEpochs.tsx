import {Epoch, HEDSchemaElement, HEDTag} from '../types';

/**
 * getEpochsInRange
 *
 * @param {Epoch[]} epochs - Array of epoch
 * @param {[number, number]} interval - Time interval to search
 * @returns {Epoch[]} - Epoch[] in interval with epochType
 */
export const getEpochsInRange = (epochs, interval) => {
  return [...Array(epochs.length).keys()].filter((index) =>
    (
      (isNaN(epochs[index].onset) && interval[0] === 0)
      ||
      (
        epochs[index].onset + epochs[index].duration > interval[0] &&
        epochs[index].onset < interval[1]
      )
    )
  );
};

/**
 * getTagsForEpoch
 *
 * @param {Epoch} epoch - An epoch
 * @param {any[]} datasetTags - HED tags in the dataset
 * @param {HEDSchemaElement[]} hedSchema - HED schema to search
 * @returns {HEDTag[]} - List of HED tags within dataset associated with the epoch
 */
export const getTagsForEpoch = (
  epoch: Epoch, datasetTags: any, hedSchema: HEDSchemaElement[]
) => {
  const hedTags = [];

  // if (datasetTags['EventValue'].hasOwnProperty(epoch.label)) {
  //   hedTags.push(...datasetTags['EventValue'][epoch.label])
  // }

  if (datasetTags['trial_type'].hasOwnProperty(epoch.trialType)) {
    hedTags.push(...datasetTags['trial_type'][epoch.trialType]);
  }

  epoch.properties.forEach((prop) => {
    if (datasetTags[prop.PropertyName].hasOwnProperty(prop.PropertyValue)) {
      hedTags.push(...datasetTags[prop.PropertyName][prop.PropertyValue]);
    }
  });

  return hedTags.map((tag) => {
    const schemaTag = hedSchema.find((t) => {
      return t.id === tag.HEDTagID;
    });
    return {
      schemaElement: schemaTag ?? null,
      HEDTagID: schemaTag ? schemaTag.id : null,
      ID: tag.ID,
      TagValue: tag.TagValue,
      Description: tag.Description,
      HasPairing: tag.HasPairing,
      PairRelID: tag.PairRelID,
      PropertyName: tag.PropertyName,
      PropertyValue: tag.PropertyValue,
      AdditionalMembers: tag.AdditionalMembers,
      TaggedBy: tag.TaggedBy,
      TaggerName: tag.TaggerName,
      Endorsements: [],
    };
  }).filter((tag) => {
    return tag.HEDTagID !== null || tag.PairRelID !== null;
  });
};

/**
 * getNthMemberTrailingCommaIndex
 *
 * @param {string} tagString - HED string
 * @param {number} n - Nth member to encapsulate. Members, (can), (be, groups)
 * @returns {number} - Returns index of comma expected after nth member
 */
const getNthMemberTrailingCommaIndex = (tagString: string, n: number) => {
  if (n < 1) {
    return tagString.length;
  }

  let membersToFind = n;
  let openParenthesesCount = 0;
  let commaIndex = 0;
  for (let i = 0; i < tagString.length; i++) {
    if (tagString[i] === '(') {
      openParenthesesCount++;
    } else if (tagString[i] === ')') {
      openParenthesesCount--;
    }
    if (openParenthesesCount === 0 && tagString[i] === ',') {
      if (--membersToFind === 0) {
        break;
      }
    }
    commaIndex = i;
  }
  return commaIndex + 1;
};

/**
 * buildHEDString
 *
 * @param {HEDTag[]} hedTags - List of HED tags
 * @param {boolean} longFormHED - Shows long form of HED tag if true
 * @returns {string[]} - String array representing the assembled HED tags
 */
export const buildHEDString = (hedTags: HEDTag[], longFormHED = false) => {
  const rootTags = hedTags.filter((tag) => {
    return !hedTags.some((t) => {
      return tag.ID === t.PairRelID;
    });
  });

  const tagNames = [];
  let tagString = '';
  rootTags.forEach((tag: HEDTag) => {
    const tagGroup = [];
    let groupMember = tag;
    while (groupMember) {
      tagGroup.push(groupMember);
      groupMember = hedTags.find((hedTag: HEDTag) => {
        return hedTag.ID === groupMember.PairRelID;
      });
    }

    let subGroupString = '';
    tagGroup.reverse().forEach((groupTag: HEDTag) => {
      if (groupTag.PairRelID === null) {
        tagString = longFormHED
          ? groupTag.schemaElement.longName
          : groupTag.schemaElement.name;
      } else {
        if (groupTag.HasPairing == '1') {
          if (groupTag.AdditionalMembers > 0 || subGroupString.length === 0) {
            const commaIndex = getNthMemberTrailingCommaIndex(
              tagString,
              groupTag.AdditionalMembers + (
                subGroupString.length > 0 ? 0 : 1
              )
            );
            tagString = '(' +
              (
                groupTag.HEDTagID !== null
                  ? `${longFormHED
                    ? groupTag.schemaElement.longName
                    : groupTag.schemaElement.name
                  }, `
                  : ''
              ) +
              (subGroupString.length > 0 ? `${subGroupString}, ` : '') +
              tagString.substring(0, commaIndex) + ')' +
              tagString.substring(commaIndex);

            subGroupString = '';
          } else {
            if (groupTag.HEDTagID === null) {
              if (subGroupString.length > 0) {
                subGroupString = `(${subGroupString})`;
              } else {
                console.error('"UNEXPECTED" STATE');
              }
            } else {
              if (subGroupString.length > 0) {
                subGroupString = `(${longFormHED
                  ? groupTag.schemaElement.longName
                  : groupTag.schemaElement.name
                }, ${subGroupString})`;
              } else {
                tagString = `(${longFormHED
                  ? groupTag.schemaElement.longName
                  : groupTag.schemaElement.name
                }, ${tagString})`;
              }
            }
          }
        } else {
          if (subGroupString.length > 0) {
            tagString = `${subGroupString}, ${tagString}`;
          }
          subGroupString = longFormHED
            ? groupTag.schemaElement.longName
            : groupTag.schemaElement.name;
        }
      }
    });
    tagNames.push(tagString);
  });

  return tagNames;
};

/**
 * getNthMemberTrailingCommaIndex
 *
 * @param {any[]} tagBadgeGroup - HED badge list
 * @param {number} n - Nth member to encapsulate. Members, (can), (be, groups)
 * @returns {number} - Returns index of comma expected after nth member
 */
export const getNthMemberTrailingBadgeIndex = (
  tagBadgeGroup: any[], n: number
) => {
  if (n === 0) {
    return tagBadgeGroup.length;
  }

  let membersToFind = n;
  let openParenthesesCount = 0;
  let commaIndex = 0;

  for (let i = 0; i < tagBadgeGroup.length; i++) {
    if (tagBadgeGroup[i].type === 'span') {
      if (tagBadgeGroup[i].props.children === '(') {
        openParenthesesCount++;
      } else if (tagBadgeGroup[i].props.children === ')') {
        openParenthesesCount--;
        if (openParenthesesCount === 0) {
          membersToFind--;
        }
      }
    }
    if (tagBadgeGroup[i].type === 'div' && openParenthesesCount === 0) {
      membersToFind--;
    }

    commaIndex = i;
    if (membersToFind === 0) {
      break;
    }
  }
  return commaIndex + 1;
};

/**
 * getRootTags
 *
 * @param {HEDTag[]} tags - HEDTag list
 * @returns {HEDTag[]} - Returns the root tags
 */
export const getRootTags = (tags: HEDTag[]) => {
  return tags.filter((tag) => {
    return tag.ID &&
      !tags.some((t) => {
        return tag.ID === t.PairRelID;
      });
  });
};

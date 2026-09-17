import * as React from 'react';
// *******************************************************
// INFO ICON COMPONENT
// *******************************************************
interface IInfoIcon {
  title: string;
  url: string;
  tooltipText?: string,
}

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.url
 * @param root0.tooltipText
 */
export const InfoIcon: React.FC<IInfoIcon> = ({
                                                title,
                                                url,
                                                tooltipText = null,
                                              }) => (
  <a
    href={url}
    target="_blank"
    style={{
      cursor: 'help',
      marginLeft: '5px',
      color: '#A9A9A9',
    }}
    title={tooltipText ? null : title}
    className={tooltipText ? 'browser-index-css-tooltip' : ''}
  >
    <i className='glyphicon glyphicon-info-sign'/>
    {
      tooltipText && <span className='browser-index-tooltip-text'>{tooltipText}</span>
    }
  </a>
);

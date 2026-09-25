import React, {
  CSSProperties,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';

export type PanelView = {
  title?: ReactNode;
  subtitle?: string;
  content: ReactNode;
};

export type PanelProps = {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  id?: string;
  height?: CSSProperties['height'];
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
  views?: PanelView[];
  onChangeView?: (index: number) => void;
  panelSize?: CSSProperties['height'];
  style?: CSSProperties;
  maxHeight?: CSSProperties['maxHeight'];
};

/** A collapsible panel component with optional multiple views. */
function Panel({
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  id = 'default-panel',
  height = '100%',
  title,
  className = 'panel-primary',
  children,
  views: viewDefinitions,
  onChangeView,
  collapsible = false,
  panelSize,
  style,
  maxHeight,
}: PanelProps): ReactElement {
  const [internalCollapsed, setInternalCollapsed] = useState(
    defaultCollapsed
  );
  const [activeView, setActiveView] = useState(0);
  const {t} = useTranslation();
  const collapsed = controlledCollapsed ?? internalCollapsed;

  /**
   * Toggle whether panel is displayed as collapsed
   */
  const toggleCollapsed = () => {
    if (!collapsible) return;

    const nextCollapsed = !collapsed;
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  /**
   * User clicked a view to display.
   *
   * @param {number} index
   */
  const viewClicked = (index: number) => {
    setActiveView(index);
    onChangeView?.(index);
  };

  // Panel Views (START)
  const viewOptions: ReactElement[] = [];
  const content: ReactElement[] = [];
  let viewMenu: ReactElement | undefined;
  if (viewDefinitions) {
    for (const [index, view] of viewDefinitions.entries()) {
      viewOptions.push(
        <li key={index}
          onClick={() => viewClicked(index)}
          className={index === activeView ? 'active' : undefined}>
          <a data-target={`${index}_panel_content`}>
            {view['title']}
          </a>
        </li>
      );
      content.push(
        <div key={index}
          id={`${index}_panel_content_${id}`}
          className={index === activeView ?
            `${index}_panel_content` : `${index}_panel_content hidden`}>
          {view['content']}
        </div>
      );
    }
    viewMenu = (
      <div className='btn-group views'>
        <button type='button'
          className='btn btn-default btn-xs dropdown-toggle'
          data-toggle='dropdown'>
          {t('Views', {ns: 'loris'})}<span className='caret'/>
        </button>
        <ul className='dropdown-menu pull-right'
          role='menu'>
          {viewOptions}
        </ul>
      </div>
    );
  }
  // Panel Views (END)

  // Add panel header, if title is set
  const panelHeading = title || viewDefinitions ? (
    <div className='panel-heading'>
      <h3 className='panel-title'>
        {viewDefinitions && viewDefinitions[activeView]['title']
          ? viewDefinitions[activeView]['title']
          : title}
        {viewDefinitions && viewDefinitions[activeView]['subtitle']
          && <span>
            {!viewDefinitions[activeView]['subtitle'].endsWith('-1')
              ? ' | ' + `${viewDefinitions[activeView]['subtitle']}`
              : ' | ' + 'Loading...'
            }
          </span>
        }
      </h3>
      {viewMenu}
      {collapsible
        ? <button
          type='button'
          onClick={toggleCollapsed}
          aria-controls={id}
          aria-expanded={!collapsed}
          aria-label={collapsed
            ? t('Expand', {ns: 'loris'})
            : t('Collapse', {ns: 'loris'})}
          style={{
            background: 'none',
            border: 0,
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            aria-hidden='true'
            className={collapsed
              ? 'glyphicon glyphicon-chevron-down'
              : 'glyphicon glyphicon-chevron-up'}
          />
        </button>
        : null}
    </div>
  ) : '';

  /**
   * Renders the React component.
   *
   * @return {ReactElement} - React markup for component.
   */
  return (
    <div className={`panel ${className}`}
      style={{height: panelSize, maxHeight}}>
      {panelHeading}
      <div id={id}
        className={collapsed ?
          'panel-collapse collapse' :
          'panel-collapse collapse in'}
        role='tabpanel'
        aria-hidden={collapsed}
        style={{height: 'calc(100% - 3em)'}}>
        <div className='panel-body'
          style={{...style, height}}>
          {content.length > 0 ? content : children}
        </div>
      </div>
    </div>
  );
}

export default Panel;

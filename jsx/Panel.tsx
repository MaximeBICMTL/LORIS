import React, {
  CSSProperties,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';

export type PanelView = {
  title?: ReactNode;
  subtitle?: string;
  content: ReactNode;
};

export type PanelProps = {
  initCollapsed?: boolean;
  collapsed?: boolean;
  parentId?: string | null;
  id?: string;
  height?: CSSProperties['height'];
  title?: ReactNode;
  class?: string;
  children?: ReactNode;
  views?: PanelView[];
  onChangeView?: (index: number) => void;
  collapsing?: boolean;
  bold?: boolean;
  panelSize?: CSSProperties['height'];
  style?: CSSProperties;
  maxHeight?: CSSProperties['maxHeight'];
};

/** A collapsible panel component with optional multiple views. */
function Panel(props: PanelProps): ReactElement {
  const {
    initCollapsed = false,
    parentId = null,
    id = 'default-panel',
    height = '100%',
    class: panelClass = 'panel-primary',
    collapsing = true,
  } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState(0);
  const {t} = useTranslation();

  /**
   * Similar to componentDidMount and componentDidUpdate.
   */
  useEffect(() => {
    setCollapsed(initCollapsed);
  }, []);

  /**
   * Toggle whether panel is displayed as collapsed
   */
  const toggleCollapsed = () => {
    if (collapsing) {
      setCollapsed(!collapsed);
    }
  };

  /**
   * User clicked a view to display.
   *
   * @param {number} index
   */
  const viewClicked = (index: number) => {
    setActiveView(index);
    if (props.onChangeView) {
      props.onChangeView(index);
    }
  };

  // Panel Views (START)
  const views: ReactElement[] = [];
  const content: ReactElement[] = [];
  let panelViews: ReactElement | undefined;
  if (props.views) {
    for (const [index, view] of props.views.entries()) {
      views.push(
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
    panelViews = (
      <div className='btn-group views'>
        <button type='button'
          className='btn btn-default btn-xs dropdown-toggle'
          data-toggle='dropdown'>
          {t('Views', {ns: 'loris'})}<span className='caret'/>
        </button>
        <ul className='dropdown-menu pull-right'
          role='menu'>
          {views}
        </ul>
      </div>
    );
  }
  // Panel Views (END)

  // Add panel header, if title is set
  const panelHeading = props.title || props.views ? (
    <div className='panel-heading'
      data-parent={parentId
        ? `#${parentId}`
        : null}>
      <h3 className='panel-title'>
        {props.views && props.views[activeView]['title']
          ? props.views[activeView]['title']
          : props.title}
        {props.views && props.views[activeView]['subtitle']
          && <span>
            {!props.views[activeView]['subtitle'].endsWith('-1')
              ? ' | ' + `${props.views[activeView]['subtitle']}`
              : ' | ' + 'Loading...'
            }
          </span>
        }
      </h3>
      {panelViews}
      {collapsing
        ? <span className={collapsed ?
          'glyphicon glyphicon-chevron-down' :
          'glyphicon glyphicon-chevron-up'}
        onClick={toggleCollapsed}
        data-toggle='collapse'
        data-target={`#${id}`}
        style={{cursor: 'pointer'}}/>
        : null}
    </div>
  ) : '';

  /**
   * Renders the React component.
   *
   * @return {ReactElement} - React markup for component.
   */
  return (
    <div className={`panel ${panelClass}`}
      style={{height: props.panelSize, maxHeight: props.maxHeight}}>
      {panelHeading}
      <div id={id}
        className={props.collapsed ?
          'panel-collapse collapse' :
          'panel-collapse collapse in'}
        role='tabpanel'
        style={{height: 'calc(100% - 3em)'}}>
        <div className='panel-body'
          style={{...props.style, height}}>
          {content.length > 0 ? content : props.children}
        </div>
      </div>
    </div>
  );
}

export default Panel;

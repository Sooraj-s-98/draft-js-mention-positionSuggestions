// @flow
import React from 'react'

// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import Editor from 'draft-js-plugins-editor'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import createMentionPlugin from 'draft-js-mention-plugin'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import positionSuggestions from 'draft-js-mention-plugin/lib/utils/positionSuggestions'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import createLinkifyPlugin from 'draft-js-linkify-plugin'
import Portal from 'react-portal'
import { List } from 'immutable'
import classNames from 'classnames'

import CommentEditorMentionEntry from './comment-editor-mention-entry'

// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import type { EditorState } from 'draft-js'
import type { MentionList } from '../utils/comment-utils'

type Props = {
  value: EditorState,
  mentionItems: MentionList,
  suggestions: MentionList,
  placeholder: string,
  name: string,
  focused: boolean,
  disabled: boolean,
  readOnly: boolean,
  onChange: (editorState: EditorState) => void,
  onBlur?: () => void,
  onFocus?: () => void,
  onSuggestionSearchChange: () => void,
  onSuggestionPopoverChange: () => void,
}

export default class EditorContainer extends React.PureComponent<*, *> {

  props: Props

  _editor: HTMLElement
  _focusHandle: any
  _mentionSuggestions: ?HTMLElement


componentDidMount() {
  if (this.props.focused) {
    this._focusHandle = setTimeout(() => {
      this._handleFocus()
    }, 50)
  }
}

componentWillReceiveProps(nextProps: Props) {
  if (nextProps.focused && this.props.focused !== nextProps.focused) {
    this._handleFocus()
  }

  if (!nextProps.focused && this._editor && this.props.focused !== nextProps.focused) {
    this._editor.blur()
  }
}

componentWillUnmount() {
  if (this._focusHandle && this.props.focused) {
    clearTimeout(this._focusHandle)
  }
}

// NOTE: Override built-in util for calculating pop over position
//       to detect window bounds and shift it
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
_positionSuggestions = ({ decoratorRect, popover, state, props }) => {
  // NOTE: decoratorRect has no `x` prop in node environment
  const popoverPosition = (decoratorRect.x || decoratorRect.left) + popover.offsetWidth
  const {
      left,
    ...restProps
     } = positionSuggestions({ decoratorRect, popover, state, props })

  let adjustedLeft = null
  if (popoverPosition > window.innerWidth) {
    adjustedLeft = `${parseFloat(left) - (popoverPosition % window.innerWidth)}px`
  }

  return {
    left: adjustedLeft || left,
    ...restProps,
  }
}

_mentionPlugin = createMentionPlugin({
  entityMutability: 'IMMUTABLE',
  positionSuggestions: this._positionSuggestions,
})

_linkifyPlugin = createLinkifyPlugin({
  theme: { link: 'comment-editor__link' },
  target: '_blank',
})

_handleBlur = () => {
  if (this._editor) {
    this._editor.blur()

    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }
}

_handleFocus = () => {
  if (this._editor) {
    this._editor.focus()

    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }
}

_handlePopupOpen = () => {
  this.props.onSuggestionPopoverChange(true)
}

_handlePopupClose = () => {
  this.props.onSuggestionPopoverChange(false)
}

render() {
  const plugins = [this._linkifyPlugin, this._mentionPlugin]
  const { MentionSuggestions } = this._mentionPlugin
  return (
    <div className='editor-container'>
      <Editor
        editorState={this.props.value}
        onChange={this.props.onChange}
        onBlur={this._handleBlur}
        placeholder={this.props.placeholder}
        plugins={plugins}
        ref={(node) => {
          if (node) {
            this._editor = node
          }
        }}
        readOnly={this.props.readOnly}
        disabled={this.props.disabled}
        data-ui={this.props.name ? `${this.props.name}--comment-editor` : 'note-box__comment-editor'}
      />
      {this.props.mentionItems && this.props.mentionItems.length > 0 &&
        <Portal
          isOpened
          closeOnOutsideClick
        >
          <span
            className={classNames('comment-editor--portal', {
              [`comment-editor--${this.props.name}-portal`]: Boolean(this.props.name),
            })}
          >
            <MentionSuggestions
              ref={(node) => {
                if (node) {
                  this._mentionSuggestions = node
                }
              }}
              onSearchChange={this.props.onSuggestionSearchChange}
              suggestions={this.props.suggestions}
              entryComponent={CommentEditorMentionEntry}
              onOpen={this._handlePopupOpen}
              onClose={this._handlePopupClose}
            />
          </span>
        </Portal>
      }
    </div>
  )
}
}

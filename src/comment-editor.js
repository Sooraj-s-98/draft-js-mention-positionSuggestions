// @flow

import React from 'react'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import { EditorState, ContentState, SelectionState } from 'draft-js'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig

import classNames from 'classnames'


import CommentUtils from './comment-utils'
import EditorContainer from './editor-container'

import type { MentionList } from './comment-utils'

import "../../../../node_modules/draft-js/dist/Draft.css";
import "../../../../node_modules/draft-js-linkify-plugin/lib/plugin.css";
import "../../../../node_modules/draft-js-mention-plugin/lib/plugin.css";


export type Props = {
  mentionItems: MentionList,
  value: string,
  autofocus?: boolean,
  clearOnBlur: boolean,
  disabled: boolean,
  editing: boolean,
  readOnly: boolean,
  className: string,
  name: string,
  placeholder: string,
  onBlur?: () => void,
  onCancel?: () => void,
  onChange?: (value: string) => void,
  onSubmit?: (content: ContentState) => void,
}

type State = {
  editorState: EditorState,
  focused: boolean, // NOTE: Cannot use CSS :focused prop
  popoverOpened: boolean,
  suggestions: MentionList,
}

export default class CommentEditor extends React.PureComponent<*, *> {
  props: Props

  static displayName = 'CommentEditor'

  static defaultProps = {
    autofocus: true,
    clearOnBlur: false,
    className: '',
    disabled: false,
    editing: false,
    placeholder: '',
    readOnly: false,
    value: CommentUtils.createContent(null),
    mentionItems: [],
  }

  state: State = this._getState(this.props)

  componentWillReceiveProps(nextProps: Props) {
    let nextState = {}
    if (nextProps.value !== this.state.editorState.getCurrentContent()) {
      nextState = { ...nextState, ...this._getEditorState(nextProps) }
    }

    if (this.props.autofocus !== nextProps.autofocus) {
      const editorState = nextState.editorState || this.state.editorState
      nextState = { ...nextState, ...this._setCursorAtEnd(editorState), focused: nextProps.autofocus }
    }

    if (nextProps.mentionItems !== this.props.mentionItems) {
      nextState = { ...nextState, ...this._getSuggestions(nextProps) }
    }

    this.setState(nextState)
  }

  _getState(props: Props) {
    return {
      ...this._getEditorState(props),
      ...this._getSuggestions(props),
      focused: props.autofocus,
      popoverOpened: false,
    }
  }

  _getSuggestions(props: Props) {
    return {
      suggestions: props.mentionItems,
    }
  }

  _getEditorState(props: Props) {
    const content = CommentUtils.createContent(props.value)
    const editorState = EditorState.createWithContent(content)

    return { editorState }
  }

  _handleChange = (editorState: EditorState) => {
    // NOTE: draft-js editor calls this callback in other callbacks (focus, blur)
    //       see more: https://github.com/facebook/draft-js/issues/923
    const focused = editorState.getSelection().getHasFocus()
    const effectiveEditorState = focused || !this.props.clearOnBlur ? editorState : this._getEditorState(this.props).editorState
    const effectiveContent = effectiveEditorState.getCurrentContent()

    // NOTE: We need to call `onChange` after the state has been set otherwise there will be mismatch
    //       in data when receiving new value from parent component
    //       draft-js always needs up-to-date info:
    //       https://github.com/facebook/draft-js/blob/master/docs/Advanced-Topics-Issues-and-Pitfalls.md#delayed-state-updates
    this.setState({
      editorState: EditorState.push(editorState, effectiveContent, 'insert-characters'),
      focused,
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(effectiveContent)
      }
    })
  }

  _clearEditor() {
    const editorState = this._getEditorState(this.props)
    const cleanEditorState = this._setCursorAtEnd(editorState.editorState)
    this.setState({ ...cleanEditorState, focused: false, popoverOpened: false })
  }

  _handleShortcut = (type: string, e: SyntheticInputEvent<*>) => {
    // if (this.state.popoverOpened) {
    //   return
    // }
    // switch (type) {
    //   case ACTIONS.TEXT_EDITOR_SUBMIT: {
    //     e.preventDefault()
    //     e.stopPropagation() // NOTE: because of other shortcuts listen to enter (e.g. open smart object)
    //     const content = this.state.editorState.getCurrentContent()
    //     if (this.props.onSubmit && !this.props.disabled && CommentUtils.commentHasText(content)) {
    //       this.props.onSubmit(content)
    //     }
    //     break
    //   }
    //   case ACTIONS.TEXT_EDITOR_CANCEL:
    //     e.preventDefault()
    //     e.stopPropagation() // NOTE: because of other shortcuts listen to enter (e.g. open smart object)
    //     this._clearEditor()
    //     if (this.props.onCancel) {
    //       this.props.onCancel()
    //     }
    //     break
    // }
  }


  _onSearchChange = ({ value }: { value: string }) => {
    console.log(value)
    const searchValue = value.toLowerCase()
    const filteredSuggestions = this.props.mentionItems.filter((mention) => {
      return !value || mention['name'].toLowerCase().indexOf(searchValue) > -1
    })

    this.setState({
      suggestions: filteredSuggestions,
      searchValue,
    })
  }

  // NOTE: Manually setting cursor to the end because `nextProps` might contain
  //       new value which is `ContentState` instance -> does not have information
  //       regarding to cursor positions.
  //       This is apparent when editing existing comments (otherwise cursor will
  //       appear at the beginning of editor)
  _setCursorAtEnd(editorState: EditorState): { editorState: EditorState } {
    const content = editorState.getCurrentContent()
    const blockMap = content.getBlockMap()

    const key = blockMap.last().getKey()
    const length = blockMap.last().getLength()

    const selection = new SelectionState({
      anchorKey: key,
      anchorOffset: length,
      focusKey: key,
      focusOffset: length,
    })

    return {
      editorState: EditorState.acceptSelection(
        editorState,
        selection
      )
    }
  }

  _onPopoverToggle = (state) => {
    this.setState({
      popoverOpened: state,
    })
  }

  _setFocus = () => {
    if (this.props.readOnly) {
      return
    }
    this.setState({ focused: true })
  }

  render() {
  const content = (
      <div
        className={classNames('comment-editor', {
          [`comment-editor--${this.props.name}`]: Boolean(this.props.name),
          'comment-editor--read-only': this.props.readOnly,
          'comment-editor--focused': this.state.focused,
          [this.props.className]: Boolean(this.props.className),
        })}
        onClick={this._setFocus}
        style={{border: '1px solid black', padding: '5px'}}
      >
        <EditorContainer
          value={this.state.editorState}
          mentionItems={this.props.mentionItems}
          suggestions={this.state.suggestions}
          placeholder={this.props.placeholder}
          name={this.props.name}
          focused={this.state.focused}
          disabled={this.props.disabled}
          readOnly={this.props.readOnly}
          onChange={this._handleChange}
          onBlur={this._handleBlur}
          onSuggestionSearchChange={this._onSearchChange}
          onSuggestionPopoverChange={this._onPopoverToggle}
        />
      </div>
    )

    return (
      <div>
        <p>Popover opened {`${this.state.popoverOpened}`}</p>
        <p>Suggestion state {`${this.state.suggestions.length}`}</p>
        <p>Search value {`${this.state.searchValue}`}</p>


        {content}
      </div>
    )
  }
}

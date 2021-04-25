// @flow
import React from 'react'
import { Map } from 'immutable'

type EntryMention = Map<string, string>

type Props = {
  mention: EntryMention,
  theme: Object,
  onMouseDown: () => {},
  onMouseEnter: () => {},
  onMouseUp: () => {},
  className: ?string,
  isFocused: boolean,
  role: ?string,
}

export default class CommentEditorMentionEntry extends React.PureComponent<*> {

  props: Props

  _node: any

  static defaultProps = {
    theme: {
      mentionSuggestionsEntryText: '',
    },
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.isFocused) {
      this._focus()
    }
  }

  _focus() {
    if (this._node && this._node.scrollIntoViewIfNeeded) {
      this._node.scrollIntoViewIfNeeded()
    }
  }

  render() {
    return (
      <div
        ref={(node) => {
          this._node = node
        }}
        className={this.props.className}
        onMouseDown={this.props.onMouseDown}
        onMouseEnter={this.props.onMouseEnter}
        onMouseUp={this.props.onMouseUp}
        role={this.props.role}
      >
        <span className={this.props.theme.mentionSuggestionsEntryText}>{this.props.mention.get('name')}</span>
      </div>
    )
  }
}

import React from 'react';
import { render } from 'react-dom';
import CommentEditor from './comment-editor';
import CommentUtils from './comment-utils'

const mentionItems = [
  {
    id: 1,
    email: 'test1@testing.com',
    name: 'Tester 1',
  },
  {
    id: 2,
    email: 'test2@testing.com',
    name: 'Tester 2',
  },
  {
    id: 3,
    email: 'test2@testing.com',
    name: 'Tester 3',
  },
  {
    id: 4,
    email: 'xxxx@testing.com',
    name: 'User',
  },
]

class App extends React.PureComponent {

  state = {
    editorContent: CommentUtils.createContent(null)
  }

  setEditorValue = (value) => {
    this.setState({
      editorContent: value,
    })
  }

  render() {
    return (
      <div>
        <CommentEditor mentionItems={mentionItems} value={this.state.editorContent} />
      </div>
    )
  }

};

render(<App />, document.getElementById('root'));

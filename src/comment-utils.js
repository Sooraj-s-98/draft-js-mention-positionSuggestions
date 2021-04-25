// @flow
import { Map, List } from 'immutable'
// NOTE: Import `draft-js` functions directly from their respective files
//       because default import originates in main file (`Draft.js`) which unecessarily
//       loads the whole library
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import ContentState from 'draft-js/lib/ContentState'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import { default as convertFromRaw } from 'draft-js/lib/convertFromRawToDraftState'
// $FlowFixMe: draft-js library has problems with Flowtype, ignored in .flowconfig
import { default as convertToRaw } from 'draft-js/lib/convertFromDraftStateToRaw'

export type Mention = {
  id: number,
  name: string,
  email: string,
}

export type MentionList = Array<Mention>

export default class CommentUtils {
  static getMentions(members): Array<Mention> {
    return members
      .filter((member: Member) => member.get('name'))
      .map((member: Member) => Map({
        id: member.get('user_id'),
        name: member.get('name'),
        email: member.get('email'),
      }))
      .toJS()
    // NOTE: immutable not supported by mentions plugin,
    //       will be deprecated
  }

  static commentHasText(comment: ContentState | string): boolean {
    if (comment instanceof ContentState) {
      return Boolean(comment.getPlainText().trim())
    }
    return Boolean(comment.trim())
  }

  static createContent(value: ?ContentState | ?Object | ?string): ContentState {
    if (value && value instanceof ContentState) {
      return value
    }
    return value instanceof Object ?
      convertFromRaw(value) :
      ContentState.createFromText(value || '')
  }

  static getPlainText(value: ContentState): string {
    return value && value instanceof ContentState ? value.getPlainText() : value || ''
  }

  static serializeContent(content: ContentState): string {
    try {
      const cleanContent = CommentUtils.cleanNewLinesInContent(content)
      return JSON.stringify(convertToRaw(cleanContent))
    } catch (e) {
      throw new Error('Invalid or deformed draft-js content state')
    }
  }

  // NOTE: This utility method will only keep single new line between two blocks
  //       This is to avoid having extra lines in comments
  static cleanNewLinesInContent(content: ContentState): ContentState {
    let keysToRemove = List([])
    const blockMap = content.get('blockMap').toList()

    content.get('blockMap').forEach((block, key, iter) => {
      const index = iter.keySeq().findIndex(k => k === key)
      if (block.get('text').length === 0 && block.get('characterList').size === 0) {
        const nextIndex = index + 1
        const nextBlock = blockMap.get(nextIndex)

        if (nextBlock && nextBlock.get('text').length === 0 && nextBlock.get('characterList').size === 0) {
          keysToRemove = keysToRemove.push(key)
        }
      }
    })

    let filteredContent = content

    keysToRemove.forEach((key) => {
      filteredContent = filteredContent.deleteIn(['blockMap', key])
    })

    return filteredContent
  }

  static commentChanged(comment: ?ContentState | ?string, commentToCompare: ?ContentState | ?string): boolean {
    return Boolean(comment !== commentToCompare)
  }
}

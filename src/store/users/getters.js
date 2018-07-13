import { get } from 'lodash'

export const user = (state) => (username) => get(state, username, null)
export const userFollowers = (state) => (username) => get(state, `followers.${username}`, null)
export const userFollowing = (state) => (username) => get(state, `following.${username}`, null)
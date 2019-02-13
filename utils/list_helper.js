const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => blogs.reduce((sum, blog) => sum + blog.likes, 0)

const favoriteBlog = (blogs) => {
  const mostLiked = blogs.reduce((mostLiked, current) => {
    return (mostLiked.likes || 0) <= current.likes ? current : mostLiked
  }, {})
  return mostLiked
    ? {
      title: mostLiked.title,
      author: mostLiked.author,
      likes: mostLiked.likes
    }
    : {}
}

const mostBlogs = (blogs) => {
  return _.map(_.countBy(blogs, 'author'), (value, key) => {
    return { author: key, blogs: value }
  }).reduce((mostBlogs, current) => {
    return (mostBlogs.blogs || 0) <= current.blogs ? current : mostBlogs
  }, {})
}

const mostLikes = (blogs) => {
  return _.map(
    blogs.reduce((likeCounts, blog) => {
      likeCounts[blog.author]
        ? (likeCounts[blog.author] += blog.likes)
        : (likeCounts[blog.author] = blog.likes)
      return likeCounts
    }, {}),

    (value, key) => {
      return { author: key, likes: value }
    }
  ).reduce((mostLiked, entry) => {
    return (mostLiked.likes || 0) <= entry.likes ? entry : mostLiked
  }, {})
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}

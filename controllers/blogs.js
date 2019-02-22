const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.status(200).json(blogs.map((blog) => blog.toJSON()))
})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    const populatedBlog = await Blog.findById(savedBlog._id).populate('user', {
      _id: 1,
      name: 1,
      username: 1
    })
    response.status(201).json(populatedBlog)
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const blogToDelete = await Blog.findById(request.params.id)
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (
      !request.token ||
      !decodedToken.id ||
      decodedToken.id.toString() !== blogToDelete.user.toString()
    ) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const removedBlog = await Blog.findByIdAndDelete(request.params.id)
    const user = await User.findById(removedBlog.user._id)
    user.blogs = user.blogs.filter(
      (blogId) => blogId.toString() !== removedBlog._id.toString()
    )
    await user.save()

    response.status(204).end()
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
      new: true
    })
    const populatedBlog = await Blog.findById(updatedBlog._id).populate(
      'user',
      {
        _id: 1,
        name: 1,
        username: 1
      }
    )
    response.status(200).json(populatedBlog)
  } catch (exception) {
    next(exception)
  }
})

module.exports = blogsRouter

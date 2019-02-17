const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})

test('all blogs are returned as json', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(response.body.length).toBe(helper.initialBlogs.length)
})

test('blogs have an \'id\' field', async () => {
  const response = await api.get('/api/blogs')

  for (let blog of response.body) {
    expect(blog.id).toBeDefined()
  }
})

test('a blog can be added', async () => {
  const newBlog = {
    title: 'Neuralink and the Brain’s Magical Future',
    author: 'Tim Urban',
    url: 'https://waitbutwhy.com/2017/04/neuralink.html',
    likes: 12
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDatabase()
  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map((blog) => blog.title)
  expect(titles).toContain('Neuralink and the Brain’s Magical Future')
})

test('undefined likes results in 0 likes', async () => {
  const newBlog = {
    title: 'Neuralink and the Brain’s Magical Future',
    author: 'Tim Urban',
    url: 'https://waitbutwhy.com/2017/04/neuralink.html'
  }

  const addedBlog = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  expect(addedBlog.body.likes).toBe(0)
})

test('undefined title results in 400 Bad Request', async () => {
  const newBlog = {
    author: 'Tim Urban',
    url: 'https://waitbutwhy.com/2017/04/neuralink.html',
    likes: 12
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('undefined url results in 400 Bad Request', async () => {
  const newBlog = {
    title: 'Neuralink and the Brain’s Magical Future',
    author: 'Tim Urban',
    likes: 12
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDatabase()

  const blogToDelete = blogsAtStart[0]

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

  const blogsAtEnd = await helper.blogsInDatabase()

  expect(blogsAtEnd.length).toBe(helper.initialBlogs.length - 1)

  const titles = blogsAtEnd.map((blog) => blog.title)

  expect(titles).not.toContain(blogToDelete.title)
})

test('likes of a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDatabase()

  const blogToUpdate = blogsAtStart[0]
  blogToUpdate.likes = 42

  const updatedBlog = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200)

  expect(updatedBlog.body.likes).toBe(42)
})

afterAll(() => {
  mongoose.connection.close()
})

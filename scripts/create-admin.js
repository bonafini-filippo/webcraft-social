const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        isAdmin: true
      }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@blogsocial.com',
        username: 'admin',
        name: 'Administrator',
        password: hashedPassword,
        isAdmin: true,
      },
    })

    console.log('Admin user created successfully!')
    console.log('Email: admin@blogsocial.com')
    console.log('Password: admin123')
    console.log('Username: admin')
    console.log('')
    console.log('IMPORTANT: Please change the default password after first login!')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 
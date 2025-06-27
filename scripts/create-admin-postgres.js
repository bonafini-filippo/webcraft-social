const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hash della password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Crea l'utente admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        bio: 'System Administrator',
        isAdmin: true,
        isActive: true
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@example.com')
    console.log('🔑 Password: admin123')
    console.log('👤 Username: admin')
    console.log('🛡️ Admin privileges: enabled')
    console.log('')
    console.log('Admin ID:', admin.id)
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Admin user already exists!')
    } else {
      console.error('❌ Error creating admin user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 
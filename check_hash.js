const bcrypt = require('bcryptjs');

const hash = '$2b$10$kdeLVMw4wrdTd8pkmC9ZR.bFtGP21yuvEIv6Pi3.epn5rW5a83wuq';

console.log('admin:', bcrypt.compareSync('admin', hash));
console.log('admin123:', bcrypt.compareSync('admin123', hash));
console.log('password:', bcrypt.compareSync('password', hash));
console.log('123456:', bcrypt.compareSync('123456', hash));
console.log('admin@test.com:', bcrypt.compareSync('admin@test.com', hash));

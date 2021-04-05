const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

const Note = conn.define('note', {
  text: STRING
});

User.hasMany(Note);
Note.belongsTo(User);

User.byToken = async (token) => {
  try {
    const userId = jwt.verify(token, process.env.JWT).userId;
    const user = await User.findByPk(userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username,
    }
  });
  if(user && await bcrypt.compare(password, user.password)){
    const token = jwt.sign({userId: user.id}, process.env.JWT);
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];

  const notes = [
    { text: 'this is a note 1', userId: 1 },
    { text: 'this is a note 2', userId: 2 },
    { text: 'this is a note 3', userId: 3 }
  ];

  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map( note => Note.create(note))
  );

  return {
    users: {
      lucy,
      moe,
      larry
    },
    notes: {
      note1,
      note2,
      note3
    }
  };
};

User.beforeCreate(async function(user) {
    const hashedPwd = await bcrypt.hash(user.password, 3)
    user.password = hashedPwd;
})

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};

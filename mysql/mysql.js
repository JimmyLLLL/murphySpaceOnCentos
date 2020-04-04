const mysql = require('mysql');
const config = require('../config/default.js')

const pool  = mysql.createPool({
  host     : config.database.HOST,
  user     : config.database.USERNAME,
  password : config.database.PASSWORD,
  database : config.database.DATABASE,
  multipleStatements:true
});

let query = function( sql, values ) {

  return new Promise(( resolve, reject ) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        reject( err )
      } else {
        connection.query(sql, values, ( err, rows) => {
          if ( err ) {
            reject( err )
          } else {
            resolve( rows )
          }
          connection.release()
        })
      }
    })
  })

}


let users =
    `create table if not exists users(
     name VARCHAR(100) NOT NULL,
     nickname VARCHAR(100) DEFAULT 'JimmyLam的家人',
     word TEXT(0),
     pass VARCHAR(100) NOT NULL,
     avator VARCHAR(100),
     moment VARCHAR(100) NOT NULL,
     PRIMARY KEY ( name )
    );`

let posts =
    `create table if not exists posts(
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL,
     title TEXT(0) NOT NULL,
     content TEXT(0) NOT NULL,
     uid VARCHAR(40) NOT NULL,
     moment VARCHAR(100) NOT NULL,
     comments VARCHAR(200) NOT NULL DEFAULT '0',
     pv VARCHAR(40) NOT NULL DEFAULT '0',
     avator VARCHAR(100) DEFAULT 'default.jpeg',
     PRIMARY KEY ( id )
    );`

let comment =
    `create table if not exists comment(
     id INT NOT NULL AUTO_INCREMENT,
     name VARCHAR(100) NOT NULL,
     nickname VARCHAR(100) NOT NULL,
     content TEXT(0) NOT NULL,
     moment VARCHAR(40) NOT NULL,
     postid VARCHAR(40) NOT NULL,
     avator VARCHAR(100) NOT NULL,
     PRIMARY KEY ( id )
    );`



let createTable = function( sql ) {
  return query( sql, [] )
}


// 建表
createTable(users)
createTable(posts)
createTable(comment)



//查找所有评论
let getAllComment = function(value){
  let _sql = `select * from comment where postid="${value}"`
  return query(_sql)
}

//注册的时候看看用户存不存在
let getExistAccount = function(value){
  let _sql = `select name from users where name="${value}"`
  return query(_sql)
}

//等到新的头像
let getNewAvator = function(value){
  let _sql = `select avator from users where name="${value}"`
  return query(_sql)
}

//登出
let logout = function(value){
  console.log(value)
  let _sql = `delete from loginUsers where name="${value}";`
  return query(_sql,value)
}


// 注册用户
let insertData = function( value ) {
  let _sql = "insert into users set name=?,pass=?,avator=?,moment=?;"
  return query( _sql, value )
}
let loginFunction = function(value){
  let _sql = `select * from users where name="${value[0]}"`
  return query(_sql)
}

// 删除用户
let deleteUserData = function( name ) {
  let _sql = `delete from users where name="${name}";`
  return query( _sql )
}
// 查找用户
let findUserData = function( name ) {
  let _sql = `select * from users where name="${name}";`
  return query( _sql )
}
// 发表文章
let insertPost = function( value ) {
  let _sql = "insert into posts set name=?,title=?,content=?,uid=?,moment=?,avator=?;"
  return query( _sql, value )
}

// 更新修改文章
let updatePost = function(values,id){
  let _sql = `update posts set name=?,title=?,content=?,moment=? where id=${id}`
  return query(_sql,values)
}

//更新昵称，与个性签名
let PersonalInfoChange = function( value,name ) {
  let _sql = `update users set nickname=?,word=? where name="${name}";`
  return query(_sql,value)
}

//更新头像
let PersonalAvatorChange = function( avator,name ) {
  let _sql = `update users set avator=? where name="${name}";`
  return query(_sql,avator)
}

//更新头像
let CommentAvatorChange = function( avator,name ) {
  let _sql = `update comment set avator=? where name="${name}";`
  return query(_sql,avator)
}

// 更新文章评论数
let updatePostComment = function( value ) {
  let _sql = "update posts set comments=? where id=?"
  return query( _sql, value )
}

// 更新浏览数
let updatePostPv = function( value ) {
  let _sql = "update posts set pv=? where id=?"
  return query( _sql, value )
}

// 发表评论
let insertComment = function( value ) {
  let _sql = "insert into comment set name=?,nickname=?,content=?,moment=?,postid=?,avator=?"
  return query( _sql, value )
}

// 通过名字查找用户头像方便后面进行删除
let findUserAvator = function ( name ) {
  let _sql = `select avator from users where name="${name}";`
  return query( _sql)
}

// 通过名字查找用户
let findDataByName = function ( name ) {
  let _sql = `select * from users where name="${name}";`
  return query( _sql)
}
// 通过文章的名字查找用户
let findDataByUser = function ( name ) {
  let _sql = `select * from posts where name="${name}";`
  return query( _sql)
}
// 通过文章id查找
let findDataById = function ( id ) {
  let _sql = `select * from posts where id="${id}";`
  return query( _sql)
}
// 通过评论id查找
let findCommentById = function ( id ) {
  let _sql = `select * FROM comment where postid="${id}";`
  return query( _sql)
}

// 查询所有文章
let findAllPost = function () {
  let _sql = ` select * FROM posts;`
  return query( _sql)
}
// 查询分页文章
let findPostByPage = function (page) {
  let _sql = ` select * FROM posts ORDER BY moment DESC limit ${(page-1)*20},20;`
  return query( _sql)
}
// 查询个人分页文章
let findPostByUserPage = function (name,page) {
  let _sql = ` select * FROM posts where uid="${name}" order by id desc limit ${(page-1)*20},20 ;`
  return query( _sql)
}

// 删除文章
let deletePost = function(id){
  let _sql = `delete from posts where id = ${id}`
  return query(_sql)
}
// 删除评论
let deleteComment = function(id){
  let _sql = `delete from comment where id=${id}`
  return query(_sql)
}
// 删除所有评论
let deleteAllPostComment = function(id){
  let _sql = `delete from comment where postid=${id}`
  return query(_sql)
}
// 查找评论数
let findCommentLength = function(id){
  let _sql = `select content from comment where postid in (select id from posts where id=${id})`
  return query(_sql)
}

// 滚动无限加载数据
let findPageById = function(page){
  let _sql = `select * from posts limit ${(page-1)*5},5;`
  return query(_sql)
}
// 评论分页
let findCommentByPage = function(page,postId){
  let _sql = `select * from comment where postid=${postId} order by id desc limit ${(page-1)*10},10;`
  return query(_sql)
}

module.exports = {
    getAllComment,
    getExistAccount,
    getNewAvator,
    PersonalAvatorChange,
    PersonalInfoChange,
    logout,
    query,
    createTable,
    insertData,
    deleteUserData,
    findUserData,
    findDataByName,
    insertPost,
    findAllPost,
    findPostByPage,
    findPostByUserPage,
    findDataByUser,
    findDataById,
    insertComment,
    findCommentById,
    updatePost,
    deletePost,
    deleteComment,
    findCommentLength,
    updatePostComment,
    deleteAllPostComment,
    updatePostPv,
    findPageById,
    findCommentByPage,
    loginFunction,
    findUserAvator,
    CommentAvatorChange
}


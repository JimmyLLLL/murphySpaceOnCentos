const mysql = require('../mysql/mysql.js')
const jwt = require('jsonwebtoken')
const KoaStatic = require('koa-static')
const fs = require('fs')
const path = require('path')
const secret = 'JimmyLam';

const err500 = '服务端出现问题了，请联系开发者Murphy'
const err401 = '登陆鉴权信息已过期，请重新登入'


module.exports = {
    async handleBlogDelete(ctx){
        const id = ctx.request.body.id
        const token = ctx.request.headers.authorization;
        try{
            const {account} = jwt.verify(token,secret);
            const post = await mysql.findDataById(id);
            if(post[0].uid===account){
                try{
                    await mysql.deletePost(id)
                    ctx.body = {
                        message:'删除成功'
                    }
                }catch(e){
                    ctx.status = 500
                    ctx.body = {
                        message:err500
                    }
                }
            }else{
                ctx.body = 202
                ctx.body = {
                    message:'非用户执行删除'
                }
            }
        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
    },
    async findDataByName(ctx){
        const name = ctx.request.body.name
        try{
            const data = await mysql.findDataByName(name)
            ctx.body = {
                code:1,
                data
            }
        }catch(e){
            console.log(e)
            ctx.body = {
                code:0
            }
        } 
    },
    async personalGetBlog(ctx){
        const page = ctx.request.body.page
        const name = ctx.request.body.account
        try{
            const data = await mysql.findPostByUserPage(name,page)
            ctx.body = data
        }catch(e){
            ctx.status = 500
            ctx.body = {
                message:err500
            }
        }
    },
    async deleteComment(ctx){
        const id = ctx.request.body.id
        const postid = ctx.request.body.postid
        const token = ctx.request.headers.authorization;
        try{
            const payload = jwt.verify(token,secret);
            try{
                await mysql.deleteComment(id)
                const returnInfo = await mysql.getAllComment(postid)
                ctx.body = returnInfo               
            }catch(e){
                ctx.status = 500
                ctx.body = {
                    message:err500
                }
            }
            
        }catch{
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
        
    },
    async getComment(ctx){
        try{
            const index = ctx.request.body.id
            const returnInfo = await mysql.getAllComment(index)
            ctx.body = returnInfo            
        }catch(e){
            ctx.status = 500
            ctx.body = {
                message:err500
            }
        }

    },
    async sendComment(ctx){
        const token = ctx.request.headers.authorization;
        try{
            const payload = jwt.verify(token,secret);
            const name = payload.account;
            const postid = ctx.request.body.index;
            const content = ctx.request.body.value;
            let moment = new Date();
            moment = moment.toLocaleString();
            try{
                const userdata = await mysql.findUserData(name);
                const nickname = userdata[0].nickname;
                const avator = userdata[0].avator;
                await mysql.insertComment([name,nickname,content,moment,postid,avator])
                const returnInfo = await mysql.getAllComment(postid)
                ctx.body = returnInfo              
            }catch(e){
                ctx.status = 500
                ctx.body = {
                    message:err500
                }
            }

        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }        
    },
    async checkExistAccount(ctx){
        const account = ctx.request.body.account
        try{
            let data = await mysql.getExistAccount(account)
            data = data[0].name
            if(data==""||data==undefined){
                ctx.body = {
                    code:0
                }
            }else{
                ctx.body = {
                    code:1
                }
            }
        }catch(e){
            ctx.body = {
                code:0
            }
        }

    },
    async getNewAvator(ctx){
        const account = ctx.request.body.account
        try{
            let avator = await mysql.getNewAvator(account)
            avator = avator[0].avator
            ctx.body = {
                code:1,
                avator
            }
        }catch(e){
            console.log(e)
            ctx.body = {
                code:-1
            }
        }
    },
    async uploadAvatorValid(ctx){
        const token = ctx.request.headers.authorization;
        try{
            const payload = jwt.verify(token,secret);
            const account = payload.account;
            ctx.body = {
                code:1,
                account
            }  
        }catch(e){
            console.log(e)
            ctx.body = {
                code:-1
            }
        }
      
    },
    //上传博客图片
    async uploadBlogPhoto(ctx){
        const token = ctx.request.headers.authorization;
        const size = ctx.request.files.img.size
        try{
            const {account} = jwt.verify(token,secret)
            if(size===0){
                return
            }else{
                try{
                //取出数据库上次存的图片以删除
                //const lastAvator = await mysql.findUserAvator(account)
                //const deleteFile = path.join(__dirname, '../public/uploads/avator')+'/'+lastAvator[0].avator
                /*fs.unlink(deleteFile,function(error){
                    if(error){
                        console.log(error);
                        return false;
                    }
                })*/
                const file = ctx.request.files.img; // 获取上传文件
                // 创建可读流
                const reader = fs.createReadStream(file.path);
                //构建文件名
                const time = new Date().getTime();
                const fileName = time
                const extArr = file.name.split('.')
                const dotNum = extArr.length
                const ext = extArr[dotNum-1]
                const name = `${fileName}.${ext}`
                await fs.mkdir(path.join(__dirname, `../public/uploads/blog/${account}`), { recursive: true }, (err) => {
                    if (err) throw err;
                 });
                const filePath = path.join(__dirname, `../public/uploads/blog/${account}`) + '/' +name;
                //文件名构建结束
                // 创建可写流
                const upStream = fs.createWriteStream(filePath);
                // 可读流通过管道写入可写流
                reader.pipe(upStream);

                    ctx.body = {
                        url:`http://www.jinmylam.xin:8003/uploads/blog/${account}/${name}`,
                        message:'上传成功'
                    }    
                }catch(e){
                    ctx.status = 500
                    ctx.body = {
                        e,
                        message:'服务器出现问题，请联系Murphhy'
                    }
                }            
            }
        }catch(e){
            ctx.body = {
                message:err401
            }
            ctx.status = 401
        }

    },
    //上传头像图片
    async uploadAvator(ctx){
        const token = ctx.request.headers.authorization;
        const flag = ctx.request.files.file.size

        try{
            const {account} = jwt.verify(token,secret)
            if(flag===0){
                return
            }else{
                try{
                //取出数据库上次存的图片以删除
                const lastAvator = await mysql.findUserAvator(account)
                const deleteFile = path.join(__dirname, '../public/uploads/avator')+'/'+lastAvator[0].avator
                fs.unlink(deleteFile,function(error){
                    if(error){
                        console.log(error);
                        return false;
                    }
                })
                const file = ctx.request.files.file; // 获取上传文件
                // 创建可读流
                const reader = fs.createReadStream(file.path);
                //构建文件名
                let time = new Date().getTime();
                const fileName = account+time
                let extArr = file.name.split('.')
                let dotNum = extArr.length
                let ext = extArr[dotNum-1]
                const name = `${fileName}.${ext}`
                let filePath = path.join(__dirname, '../public/uploads/avator') + '/' +name;
                //文件名构建结束
                // 创建可写流
                const upStream = fs.createWriteStream(filePath);
                // 可读流通过管道写入可写流
                reader.pipe(upStream);
                    await mysql.PersonalAvatorChange(name,account);
                    await mysql.CommentAvatorChange(name,account)
                    ctx.body = {
                        message:'更改成功'
                    }    
                }catch(e){
                    ctx.status = 500
                    ctx.body = {
                        message:'服务器出现问题，请联系Murphhy'
                    }
                }            
            }
        }catch(e){
            ctx.body = {
                message:err401
            }
            ctx.status = 401
        }

    },
    async updateArticle(ctx){
        const token = ctx.request.headers.authorization;
        try{
            const {title,content,nickname,id} = ctx.request.body
            const {account} = jwt.verify(token,secret);
            let data
            try{
                data = await mysql.findDataById(id)
                data = data[0].uid                
            }catch{
                ctx.status = 500;
                ctx.body = {
                    message:err500
                }
            }

            if(account===data){
                const time = new Date().toLocaleString();
                try{
                    await mysql.updatePost([nickname,title,content,time],id)
                    ctx.body = {
                        message:'修改成功'
                    }
                }catch(e){
                    ctx.status = 500
                    ctx.body = {
                        message:'服务器遇到问题，请联系开发者Murphy'
                    }
                }                 
            }else{
                ctx.status = 202
                ctx.body = {
                    message:'非法请求'
                }
            }
           
        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
    },
    //发文章
    async sendEdit(ctx){
        const token = ctx.request.headers.authorization;
        try{
            const {title,content,nickname} = ctx.request.body
            const payload = jwt.verify(token,secret);
            const account = payload.account;
            let time = new Date();
            time = time.toLocaleString();
            try{
                await mysql.insertPost([nickname,title,content,account,time,''])
                ctx.body = {
                    code:1
                }
            }catch(e){
                ctx.status = 500
                ctx.body = {
                    e,
                    message:'服务器遇到问题，请联系开发者Murphy'
                }
            }            
        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
        
    },
    //个人信息修改
    async PersonalInfoChange(ctx){
        const token = ctx.request.headers.authorization;
        const {word,nickname} = ctx.request.body
        try{
            const {account} = jwt.verify(token,secret);
            try{
                await mysql.PersonalInfoChange([nickname,word],account)
                ctx.body = {
                    newInfo:{
                        word,
                        nickname
                    }
                }
            }catch(e){
                ctx.status = 500
                ctx.body = {
                    message:err500
                }
            }            
        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
             
    },
    //从标题进入博客内容
    async enterBlog(ctx){
        const id = ctx.request.body.id
        try{
            const data = await mysql.findDataById(id)     
            ctx.body = data[0]
            
        }catch(e){
            ctx.status = 500
            ctx.body = {
                message:err500
            }
        }
    },
    //获得博客标题列表
    async getBlog(ctx){
        const page = ctx.request.body.page
        try{
            const data = await mysql.findPostByPage(page)
            data.forEach((item)=>{
                delete item.content
            })
            ctx.body = data
        }catch(e){
            ctx.status = 500
            ctx.body = {
                message:err500
            }
        }
    },

    //注册账户
    async register (ctx) {
        const account = ctx.request.body.account;
        const password = ctx.request.body.password;
        let time = new Date();
        time = time.toLocaleString();
        try {
            await mysql.insertData([account,password,'',time]);
            ctx.body = {
                code:1
            }
        }catch(e){
            console.log(e)
            ctx.body = {
                code:0
            }
        }

    },
    //一进入网页自动登录
    async memoryLogin(ctx){
        const token = ctx.request.headers.authorization;
        try{
            const payload = jwt.verify(token,secret);
            const account = payload.account;
            const password = payload.password;
            const content = {account,password};
            const newToken = jwt.sign(content, secret, {
                expiresIn: 10800  // 3小时过期
            });
            try{
                const returnInfo = await mysql.loginFunction([account,password]);
                ctx.body = {
                    token:newToken,
                    account:returnInfo[0].name,
                    nickname:returnInfo[0].nickname,
                    word:returnInfo[0].word,
                    avator:returnInfo[0].avator
                }
            }catch(e){
                ctx.status = 500
                ctx.body = {
                    message:'服务器出现问题，请联系Murphy'
                }
            }
            
        }catch(e){
            ctx.status = 401
            ctx.body = {
                message:err401
            }
        }
    },
    //登陆账户
    async login (ctx) {
        const account = ctx.request.body.account;
        const password = ctx.request.body.password;
        try{
            const returnInfo = await mysql.loginFunction([account,password]);
            if(returnInfo[0].pass.trim()==password.trim()){
                const content = {account,password};
                const token = jwt.sign(content, secret, {
                    expiresIn: 10800  // 1小时过期
                });
                const nickname = returnInfo[0].nickname;
                const word = returnInfo[0].word;
                const avator = returnInfo[0].avator;
                ctx.body = {
                    account,
                    word,
                    nickname,
                    avator,
                    token
                }
            }else{
                ctx.status = 403
                ctx.body = {
                    message:'密码校验错误'
                }
            }             
        }catch(e){
            console.log(e)
            ctx.body = {}
        }
    },


}

const { dialog } = require('electron').remote

// 全局控制器
var Event = new Vue()

// 歌单组件
var songlist = Vue.component('songlist', {
    template: `
    <div class="songlist" @click="changesonglist(index)">
        <div>{{this.name}}</div>
        <div class="deletebtn" @click="deletesonglist(index)" :class="{'hidden':isdeletebtnshow}"><img src="./img/delete.png"></div>
    </div>
    `,
    props: ['name', 'index'],
    data: function () {
        return {
            isdeletebtnshow: true
        }
    },
    methods: {
        changesonglist: function (index) {
            Event.$emit('change-song-list', index)
        },
        deletesonglist: function (index) {
            Event.$emit('song-delete', index)
        }
    },
    mounted: function () {
        Event.$on('show-delete-btn', () => {
            this.isdeletebtnshow = !this.isdeletebtnshow
        })
        Event.$on('ojbkk', () => {
            this.isdeletebtnshow = !this.isdeletebtnshow
        })
    }
})

// 播放控制组件，上一首暂停播放下一首
var playcontrol = Vue.component('playcontrol', {
    template: `
    <div class="controlbox">
        <div class="controlboxgroup" >
            <div class="controlboxbtn">
                <img src="./img/arrow-double-left.svg" alt="<" @click="pre">
            </div>
            <div class="controlboxbtn">
                <img v-bind:src="path_play" alt=">" v-if="!isplaying" @click="play_withoutarg()">
                <img v-bind:src="path_stop" alt=">" v-if="isplaying" @click="pause()">
            </div>
            <div class="controlboxbtn">
                <img src="./img/arrow-double-right.png" alt=">" @click="next">
            </div>
        </div>
        <div class="progressbar">
            <progress value="0" max="1000000" id="pg"></progress>
        </div>
        <div class="controlboxgroup">
            <div class="controlboxbtn" @click="toggle_mute">
                <img src="./img/vol.png" v-if="!ismute">
                <img src="./img/mute.svg" v-if="ismute">
            </div>
            <div class="controlboxbtn">
                <input type="range" id="vol" max="10" min="0" value="7" @change="changevol">
            </div>
            <div class="controlboxbtn" @click="toggle_play_model">
                <img src="./img/list_circle.svg" v-if="play_model==1">
                <img src="./img/single_circle.svg" v-if="play_model==2">
                <img src="./img/random_play.svg" v-if="play_model==3">
            </div>
        </div>
    </div>
    `
    ,
    data: function () {
        return {
            // 全局唯一播放音频
            audio: null,
            isplaying: false,
            progress: null,
            // 当前正在播放的歌单序号
            nowplaying_songlist: 0,
            // 当前正在播放的歌单的第index首歌
            index: -1,
            // 播放模式{1:列表循环, 2:单曲循环,3:随机播放}
            play_model: 1,
            isfirstload: true,
            // 是否静音
            ismute: false,
            path_play: './img/play.svg',
            path_stop: './img/stop.svg',

        }
    },
    methods: {
        // 切换静音
        toggle_mute: function () {
            if (this.audio) {
                this.ismute = !this.ismute
                if (this.ismute) {
                    this.audio.volume = 0
                    document.getElementById('vol').value = 0
                }
                else {
                    this.audio.volume = 0.7
                    document.getElementById('vol').value = 7
                }
            }
        },
        // 切换播放模式
        toggle_play_model: function () {
            this.play_model = (this.play_model) % 3 + 1
        },
        changevol: function () {
            if (this.audio != null) {
                this.audio.volume = document.getElementById('vol').value / 10
            }
        },
        play_withoutarg: function () {
            if (this.audio != null) {
                this.audio.play()
                this.toggle()
            }
        },
        // 切换播放状态:播放或暂停
        toggle: function () {
            this.isplaying = !this.isplaying
        },
        // important function
        play: function (args) {
            if (this.audio != null) {
                this.audio.load()
                this.audio = null
            }
            this.audio = new Audio()
            this.audio.src = args[2]
            try {
                this.audio.play()
                this.nowplaying_songlist = args[0]
                this.index = args[1]
            } catch (e) {
                dialog.showMessageBox({
                    type: 'error',
                    buttons: '知道了',
                    title: '歌曲无法播放',
                    message: '歌曲无法播放，可能是音源损坏，请用其他播放器尝试'
                })
            }
            Event.$emit('show-now-index', this.index)
            if (this.isplaying == false) {
                this.toggle()
            }
            if (this.audio != null) {
                let _this = this
                function p() {
                    let progress = document.getElementById('pg')
                    let v = parseInt(_this.audio.currentTime * 1000000 / _this.audio.duration)
                    if (v >= 1 && v < progress.max) progress.value = v
                    if (_this.audio.duration - _this.audio.currentTime <= 1) {
                        _this.next()
                    }
                }
                this.audio.removeEventListener('timeupdate', p)
                this.audio.addEventListener('timeupdate', p)
            }
        },
        pause: function () {
            if (this.audio != null) {
                this.audio.pause()
            }
            if (this.isplaying == true) {
                this.toggle()
            }
        },
        next: function () {
            console.log('组件index发送为', this.index);
            Event.$emit('next-song', [this.nowplaying_songlist, this.index + 1, this.play_model])
        },
        pre: function () {
            Event.$emit('pre-song', [this.nowplaying_songlist, this.index - 1])
        },
    },
    mounted: function () {
        // 监听播放音乐的消息，args[0]为index
        Event.$on('play-music', (args) => {
            this.play(args)
        })
        Event.$on('set-currentTime', (args) => {
            if (this.audio != null) {
                document.getElementById('pg').value = args
                this.audio.currentTime = this.audio.duration * (args / 1000000)
            }
        })
    }
})

// 歌单管理组件
var songlistmanager = Vue.component('songlist-manager', {
    template: `
    <div class="managebox">
        <div class="btngroup">
            <div><button type="button" class="btn btn-default" @click="addsonglist">+</button></div>
            <div><button type="button" class="btn btn-default" @click="deletesonglist">-</button></div>
        </div>
        <input type="text" v-model="addtext" :class="{'hidden':isshowinput}" @keyup.13="enterpress">
    </div>
    `,
    data: function () {
        return {
            addtext: '',
            isshowinput: true,
        }
    },
    methods: {
        addsonglist: function () {
            this.isshowinput = !this.isshowinput
        },
        deletesonglist: function () {
            Event.$emit('show-delete-btn')
        },
        enterpress: function () {
            if (this.addtext == "" || this.addtext.length >= 30) {
                dialog.showMessageBox({
                    type: 'error',
                    buttons: ['知道了'],
                    title: '添加歌单失败',
                    message: '请输入30字符以内的歌单名'
                })
            }
            else {
                Event.$emit('add-a-songlist', { name: this.addtext })
                this.addtext = ''
            }
        },
    },
mounted: function() {
    Event.$on('ojbk2', () => {
        this.addsonglist()
    })
}
})


var vm = new Vue({
    el: '#app',
    data: {
        // 正在播放第几个歌单
        nowsonglistindex: 0,
        // 正在展示第几个歌单
        nowshowsonglistindex: 0,
        nowplaying: {
            state: false,
            index: -1,
        },
        songlist: [

        ],
        songs: [

        ],
    },
    methods: {
        play: function (index) {
            // 给控制台传递消息
            console.log('从歌曲列表监听到了播放音乐的请求，并发送消息到主控制台');
            Event.$emit('play-music', [this.nowshowsonglistindex, index, this.songs[this.nowshowsonglistindex].content[index].src])
            this.nowplaying.index = index
            this.nowsonglistindex = this.nowshowsonglistindex
        },
        import_songs: function () {
            let paths = dialog.showOpenDialog({
                title: '选择歌曲',
                filters: [
                    { name: 'audio', extensions: ['mp3'] }
                ],
                properties: ['openFile', 'multiSelections']
            })
            for (let i = 0; i < paths.length; i++) {
                let obj = path.parse(paths[i])
                this.songs[this.nowshowsonglistindex].content.push({
                    name: obj.name,
                    singer: '',
                    time: '',
                    src: paths[i]
                })
            }
            fs.writeFileSync('./data/' + this.songlist[this.nowshowsonglistindex] + '.json', JSON.stringify(this.songs[this.nowshowsonglistindex].content))
        }
    },
    // 在组件生命周期的created阶段，加载本地数据，包括歌单和歌单中的数据
    created: function () {
        // 读歌单信息
        let data = fs.readFileSync('./data/songlist.json', 'utf-8')
        this.songlist = JSON.parse(data)
        // 根据歌单长度读歌单中的歌曲信息
        for (let i = 0; i < this.songlist.length; i++) {
            let _path = './data/' + (this.songlist[i]) + '.json'
            let data = fs.readFileSync(_path, 'utf-8')
            this.songs.push({
                index: i,
                content: JSON.parse(data)
            })
        }
    },
    mounted: function () {
        // 事件钩子监听
        // 当监听到了用户创建歌单
        Event.$on('add-a-songlist', (args) => {
            // 有个问题当你删除一个文件时，只有你关闭exe时文件才会删除
            // 所以创建一个和刚删除的同名歌单将会报错
            try {
                let _path = './data/' + args.name + '.json'
                fs.openSync(_path, 'w+')
                this.songlist.push(args.name)
                fs.writeFile('./data/songlist.json', JSON.stringify(this.songlist), (err) => {
                    if (err) throw err;
                    console.log('The songlist has been saved!');
                })
                this.songs.push({
                    index: this.songlist.length - 1,
                    content: []
                })
                fs.writeFile(_path, "[]", (err) => {
                    if (err) throw err;
                    console.log('The file has been saved!');
                })
            } catch (e) {
                dialog.showMessageBox({
                    type: 'error',
                    buttons: ['知道了'],
                    title: '添加歌单失败',
                    message: '请重启后再添加，或者换一个名字'
                })
            } finally {
                Event.$emit('ojbk2')
            }
        })
        // 当监听到用户删除歌单
        Event.$on('song-delete', (index) => {
            // 先删除歌单对应的文件
            let _path = './data/' + this.songlist[index] + '.json'
            fs.unlinkSync(_path)
            this.songlist.splice(index, 1)
            fs.writeFile('./data/songlist.json', JSON.stringify(this.songlist), (err) => {
                if (err) throw (err)
            })
            Event.$emit('ojbkk')
        })
        // 当监听到播放歌曲改变，展示当前正在播放歌曲的信息
        Event.$on('show-now-index', (args) => {
            this.nowplaying.state = true
            this.nowplaying.index = args
        })
        // 当监听到用户切换展示的歌单
        Event.$on('change-song-list', (args) => {
            this.nowshowsonglistindex = args
        })
        // 当监听到下一曲
        Event.$on('next-song', (args) => {
            let length = this.songs[args[0]].content.length
            if (length > 0) {
                if (0 <= args[1]) {

                    if (args[2] == 2) {
                        args[1]--
                    }
                    else if (args[2] == 3) {
                        args[1] = parseInt(Math.random() * length)
                    }
                    else {
                        args[1] = (args[1]) % length
                    }
                    Event.$emit('play-music', [args[0], args[1], this.songs[args[0]].content[args[1]].src])
                }
            }
        })
        // 当监听到上一曲
        Event.$on('pre-song', (args) => {
            console.log(args);
            let length = this.songs[args[0]].content.length
            if (length > 0) {
                if (0 > args[1]) {
                    args[1] = length - 1
                }
                Event.$emit('play-music', [args[0], args[1], this.songs[args[0]].content[args[1]].src])
            }
        })
    },
    // 过滤器
    filters: {
        // 限制展示的字符长度
        min_text_length: function (value) {
            if (value.length > 60) {
                value = value.substr(0, 60) + '...'
            }
            return value
        }
    }
})

document.getElementById('pg').addEventListener('click', function (e) {
    if (e.offsetX >= this.clientWidth - 10) e.offsetX -= 10
    Event.$emit('set-currentTime', parseInt(e.offsetX * 1000000 / this.clientWidth))
})

root_path = 'E:\\CloudMusic'

var files = []

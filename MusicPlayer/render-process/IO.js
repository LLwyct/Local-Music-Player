const fs = require('fs')
const path = require('path')

var files = []

function openAndGetMp3File(_path) {

    if(fs.statSync(_path).isDirectory() == true) {
        var allfiles = fs.readdirSync(_path)
        for(let i in allfiles) {
            var nextpath = path.join(_path, './', allfiles[i])
            openAndGetMp3File(nextpath)
        }
    }
    else if(fs.statSync(_path).isFile() == true) {
        if(path.extname(_path) == '.mp3') {
            var info = path.parse(_path)
            console.log(info);
            files.push({
                name: info.name,
                singer: '',
                time: '',
                src: _path.replace('\\','\\\\'),
            })
        }
    }
}
function openAndGetMp3File_withoutsubdir(_path) {

    if(fs.statSync(_path).isDirectory() == true) {
        var allfiles = fs.readdirSync(_path)
        for(let i in allfiles) {
            var nextpath = path.join(_path, './', allfiles[i])
            if (fs.statSync(nextpath).isFile() == true) {
                if (path.extname(nextpath) == '.mp3') {
                    var info = path.parse(nextpath)
                    console.log(info);
                    files.push({
                        name: info.name,
                        singer: '',
                        time: '',
                        src: nextpath.replace('\\', '\\\\'),
                    })
                }
            }
        }
    }
}

// openAndGetMp3File('C:\\Users\\liwen\\Desktop\\新建文件夹')
// openAndGetMp3File('E:\\CloudMusic')
// openAndGetMp3File_withoutsubdir('E:\\CloudMusic')
// console.log(JSON.stringify(files).toString());
// fs.writeFile('./data/0.json', JSON.stringify(files), (err) => {
//     if (err) throw err;
//     console.log('The file has been saved!');
// })

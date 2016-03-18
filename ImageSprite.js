var images = require("images"),
	fs = require("fs"),
	path = require("path"),
	Config = require("./config").Config;


imageSprite(path.normalize(Config.src), Config.opts);

function imageSprite(src, opts) {

	// get the array of filenames
	var files = fs.readdirSync(src);
	if (files.length <= 0) { return };

	var S = {
		path: src,
		imgs: [],			// image array
		maxW: 0,			// max width
		maxH: 0,			// max height
		sumW: 0,
		sumH: 0,
		outName: opts.name,	// out file's name
		outDir: opts.out && opts.out != "" ? path.normalize(opts.out) : src // out file's dir
	}

	// check every file or dir
	files.forEach(function(f) {

		var fpath = path.join(src, f);

		if (fs.statSync(fpath).isDirectory()) {
			// handle the directory
			imageSprite(fpath, Config.opts);

		}else if (fs.statSync(fpath).isFile()){
			// handle the images, 
			// get the max width and height for all images in this dir
			var img = images(fpath);
			img.w = img.width(), img.h = img.height();
			S.maxW = S.maxW > img.w ? S.maxW : img.w;
			S.maxH = S.maxH > img.h ? S.maxH : img.h;
			S.sumW += img.width();
			S.sumH += img.h;

			S.imgs.push(img);
		}
	})

	// if exist images in this dir
	if (S.imgs.length >=1) {
		var dest, x = y = 0;
		switch (opts.direction){
			case "H": 

				dest = images(S.sumW, S.maxH);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					x += img.w;
				})

				break;
			
			case "V": {

				dest = images(S.maxW, S.sumH);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					y += img.h;
				}) 

				break;
			}
		}

		if (!S.outName || S.outName == "") {
			console.log(S.path);
			S.outName = S.path.replace(/\\+/gi, "-");
		}

		if (!fs.existsSync(S.outDir)) {
			mkdirsSync(S.outDir);
		}
		var outFieName = path.join(S.outDir, S.outName + ".png");
		dest.save(outFieName);

		console.log("Output file: " + outFieName);

		
	}
}

//创建多层文件夹 同步
function mkdirsSync(dirpath, mode) { 
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true; 
}
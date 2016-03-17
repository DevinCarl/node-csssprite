var images = require("images"),
	fs = require("fs"),
	Config = require("./config").Config;


imageSprite(Config.src, Config.opts);

function imageSprite(src, opts) {

	// get the array of filenames
	var files = fs.readdirSync(src);
	if (files.length <= 0) { return };

	var S = {
		path: src,
		imgs: [],			// image array
		maxW: 0,			// max width
		maxH: 0,			// max height
		outName: opts.name,	// out file's name
		outDir: opts.out && opts.out != "" ? opts.out : src // out file's dir
	}

	// check every file or dir
	files.forEach(function(f) {

		var fpath = src +"/"+ f;

		if (fs.statSync(fpath).isDirectory()) {
			// handle the directory
			imageSprite(fpath + "/", Config.opts);

		}else if (fs.statSync(fpath).isFile()){
			// handle the images, 
			// get the max width and height for all images in this dir
			var img = images(fpath);
			S.maxW = S.maxW > img.width() ? S.maxW : img.width();
			S.maxH = S.maxH > img.height() ? S.maxH : img.height();

			S.imgs.push(img);
		}
	})

	// if exist images in this dir
	if (S.imgs.length >=1) {
		var dest, x = y = 0;
		switch (opts.direction){
			case "H": 

				dest = images(S.maxW * S.imgs.length, S.maxH);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					x += img.width();
				})

				break;
			
			case "V": {

				dest = images(S.maxW, S.maxH * S.imgs.length);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					y += img.height();
				})

				break;
			}
		}

		if (!S.outName || S.outName == "") {
			S.outName = S.path.replace(/\/$/gi, "").replace(/\/+/gi, "-");
		}

		var outFieName = S.outDir + "/" + S.outName + ".png";
		dest.save(outFieName);

		console.log("Output file: " + outFieName);

		
	}
}
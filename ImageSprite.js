var images = require("images"),
	fs = require("fs"),
	path = require("path");

var default_opts = {
	src: "icons",
	direction: "H",			// H : horizontal / V: vertical
	out: "",						// out file's path
	name: "",						// out file's name
	w: 0,								// single icon's width
	h: 0								// single icon's height
}


// get the command line arguments
var config = commamder(process.argv);

for (var i in config) {
	default_opts[i] = config[i];
}

var all_css = [];
// do image sprite
imageSprite(default_opts);

writeAllCss(default_opts);

/******
  		@params: 
  * 	src: "icons",
  * 	direction: "H",			// H : horizontal / V: vertical
  * 	d: "H",					// H : horizontal / V: vertical
  * 	out: "dest",			// out file's path
  * 	name: ""				// out file's name
*******/
function imageSprite(opts) {

	// get the array of filenames
	if (!opts) {
		return
	};

	// normalize the opts
	opts.src = path.normalize(opts.src);
	opts.d && (opts.direction = opts.d);

	if (!fs.statSync(opts.src).isDirectory()) {
		return
	}
	var files = fs.readdirSync(opts.src);
	if (files.length <= 0) { return };

	// console.log(opts);

	var S = {
		path: opts.src,
		imgs: [],			// image array
		width: (opts.h && Number(opts.w)) || 0,	//width of max width of all imgs
		height: (opts.w && Number(opts.h)) || 0,	//height of max height of all imgs
		sumW: 0,
		sumH: 0,
		sameSize: false,
		outName: opts.name,	// out file's name
		outDir: opts.out && opts.out != "" ? path.normalize(opts.out) : path.dirname(opts.src) // out file's dir
	}


	// check every file or dir
	files.forEach(function(f) {

		var fpath = path.join(opts.src, f);

		if (fs.statSync(fpath).isDirectory()) {
			// handle the directory
			var opts_tmp = JSON.parse(JSON.stringify(opts));
			opts_tmp.src = fpath;

			imageSprite(opts_tmp);

		}else if (fs.statSync(fpath).isFile()){
			if (!isImage(fpath)) {
				console.log(fpath + " is not a image file");
				return
			}
			// handle the images, 
			// get the max width and height for all images in this dir
			try{
				var img = images(fpath);
			} catch(e){
				console.log(e);
				return
			}

			if (opts.w && opts.w > 0 && opts.h && opts.h > 0) {
				console.log("same size!", S.width, S.height);

				var imgT = images(S.width, S.height);
				var sx = (S.width - img.width())/2,
					sy = (S.height - img.height())/2;
				imgT.draw(img, sx, sy);
				img = imgT;

				img.w = S.width;
				img.h = S.height;
			}else{
				img.w = img.width();
				img.h = img.height();
				S.width = S.width > img.w ? S.width : img.w;
				S.height = S.height > img.h ? S.height : img.h;
			}

			img.name = path.basename(f, path.extname(f));

			S.sumW += img.w;
			S.sumH += img.h;

			S.imgs.push(img);
		}
	})
	// whether all images have the same size
	if (S.sumW === S.imgs.length * S.width && S.sumH === S.imgs.length * S.height) {
		S.sameSize = true;
	}

	// if exist images in this dir
	if (S.imgs.length >=1) {

		var dest, x = y = 0;
		switch (opts.direction){
			case "H": 
			case "h":
			case "horizontal": {
				S.outW = S.sumW;
				S.outH = S.height;
				S.horizontal = true;
				break;
			}
			
			case "V":
			case "v":
			case "vertical": {
				S.outW = S.width;
				S.outH = S.sumH;
				S.horizontal = false;
				break;
			}
		}
		// hand the out dir and name
		if (!S.outName || S.outName == "") {
			S.outName = S.path.replace(/\\+/gi, "-");
			S.outExt = path.extname(S.outName);
			S.outExt || (S.outExt = ".png")
		}
		if (!fs.existsSync(S.outDir)) {
			mkdirsSync(S.outDir);
		}

		var cssString = ["." + S.outName + "{",
				"\tdisplay: inline-block;",
				"\tvertical-align: top;",
				"\tbackground: url(" + S.outName + S.outExt + ") " + "0 0 no-repeat;",
				"}"];

		if (S.sameSize) {
			cssString.splice(1, 0, "\twidth: " + S.width + "px;", "\theight: " + S.height + "px;");
		}
		dest = images(S.outW, S.outH);
		S.imgs.forEach(function(img){
			dest.draw(img, x, y);
			img.x = x;
			img.y = y;

			S.horizontal ? (x += img.w) : (y += img.h);

			var cssItem = ["." + S.outName + "." + img.name + " {",
				"\tbackground-position: " + (img.x == 0 ? "0 " : ((-1) * img.x + "px ")) + (img.y == 0 ? "0;" : ((-1) * img.y + "px;")), 
				"}"];
			if (!S.sameSize) {
				cssItem.splice(1, 0, "\twidth: " + img.w + "px;", "\theight: " + img.h + "px;");
			}
			cssString = cssString.concat(cssItem);
		})


		var outFieName = path.join(S.outDir, S.outName + S.outExt);
		console.log(outFieName);
		dest.save(outFieName);

		fs.writeFile(path.join(S.outDir, S.outName + ".css"), cssString.join("\n"));

		all_css.push(cssString.join("\n"));

		console.log("Success! Output file: " + outFieName);

	}
}

//create dir sync
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

// annalyze the command line params
function commamder(cmd){
	var argv = cmd.slice(2);
	if (argv.length <= 0) {
		return;
	} 
	var command = {};
	for (var i = 0; i < argv.length; i++) {
		if(argv[i].indexOf("-") == 0){
			command[argv[i].substring(1, argv[i].length)] = argv[++i];
		}
	}
	return command;
}

function isImage(fpath) {
		var imgFormate = {".png": true, ".jpg": true, ".gif": true};
		if (imgFormate[path.extname(fpath)]) {
			return true;
		}
		return false;
}
function writeAllCss(opts) {
	if(all_css.length > 0){
		outdir = opts.out && opts.out != "" ? path.normalize(opts.out) : opts.src;
		fs.writeFile(path.join(outdir, "All-CSS.css"), all_css.join("\n\n"));
		console.log(outdir, path.join(outdir, "All-CSS.css"));
	}
}

console.log(path.extname("a.png"));
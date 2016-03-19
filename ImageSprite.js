var images = require("images"),
	fs = require("fs"),
	path = require("path");

var default_opts = {
	src: "icons",
	direction: "H",					// H : horizontal / V: vertical
	out: "css-sprite-dest",			// out file's path
	name: ""						// out file's name
}

// get the command line arguments
var config = commamder(process.argv);

for (var i in config) {
	default_opts[i] = config[i];
}

// do image sprite
imageSprite(default_opts);

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

	console.log(opts);

	var S = {
		path: opts.src,
		imgs: [],			// image array
		maxW: 0,			// max width
		maxH: 0,			// max height
		sumW: 0,
		sumH: 0,
		outName: opts.name,	// out file's name
		outDir: opts.out && opts.out != "" ? path.normalize(opts.out) : opts.src // out file's dir
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
			// handle the images, 
			// get the max width and height for all images in this dir
			try{
				var img = images(fpath);
			} catch(e){
				console.log(e);
				return
			}
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
			case "h":
			case "horizontal": {

				dest = images(S.sumW, S.maxH);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					x += img.w;
				})
				break;
			}
			
			case "V":
			case "v":
			case "vertical": {

				dest = images(S.maxW, S.sumH);
				S.imgs.forEach(function(img){
					dest.draw(img, x, y);
					y += img.h;
				}) 
				break;
			}
		}

		if (!S.outName || S.outName == "") {
			S.outName = S.path.replace(/\\+/gi, "-");
		}

		if (!fs.existsSync(S.outDir)) {
			mkdirsSync(S.outDir);
		}
		var outFieName = path.join(S.outDir, S.outName + ".png");
		dest.save(outFieName);

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

const path = require('path');
var fs = require('fs');

module.exports = {
    randint: function(min, max){
        return Math.floor(Math.random() * (max - min) + min);
    },
    
    log_func: function(ctx){
        return function(message){
            console.log(`[${ctx.name}] ${message||""}`);
        };
    },
    
    shuffle: function(array){
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    
    escapeHTML(str){
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    loadMap(asset){
        var map = JSON.parse(fs.readFileSync(path.join(process.cwd(), '/assets', asset), 'utf8'));
        map.realHeight = map.height * map.tileheight * map.scale;
        map.realWidth = map.width * map.tilewidth * map.scale;
        map.centerY = map.realHeight/2;
        map.centerX = map.realWidth/2;
        return map;
    },
}


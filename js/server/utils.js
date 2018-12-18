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
    }
}


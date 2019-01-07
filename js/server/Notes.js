const utils = require('./utils');

class NotesList extends Map{
    constructor(theme, map) {
        super();
        this.MAX_NOTES = 30;
        this._CENTER_ZONE_DIST = 1000;
        /* GEN_ZONE
            +--------------+
            |    |   Z3    |
            | Z0 +----+----+
            |    | C  |    |
            |    |  Z |    |
            +----+----+ Z2 |
            |    Z1   |    |
            +---------+----+
        */
        this._GEN_XY_ZONE = [
            {//Z0
                minX: 0, maxX: map.centerX-this._CENTER_ZONE_DIST, 
                minY: 0, maxY: map.centerY+this._CENTER_ZONE_DIST
            },
            {//Z1
                minX: 0, maxX: map.centerX+this._CENTER_ZONE_DIST,
                minY: map.centerY+this._CENTER_ZONE_DIST, maxY: map.realHeight
            },
            {//Z2
                minX: map.centerX+this._CENTER_ZONE_DIST, maxX: map.realWidth,
                minY: map.centerY-this._CENTER_ZONE_DIST, maxY: map.realHeight
            },
            {//Z3
                minX: map.centerX-this._CENTER_ZONE_DIST, maxX: map.realWidth,
                minY: 0, maxY: map.centerY-this._CENTER_ZONE_DIST
            }
        ];
        this._curr_zone_index = 0;
        this.theme = theme;
    }
    
    _nextZone() {
        this._curr_zone_index = (this._curr_zone_index < this._GEN_XY_ZONE.length-1)?
            this._curr_zone_index+1 : 0;
        return this._GEN_XY_ZONE[this._curr_zone_index];
    }

    create() {
        let note, x, y;
        let gen_zone = this._nextZone();
        do {
            x = utils.randint(gen_zone.minX, gen_zone.maxX);
            y = utils.randint(gen_zone.minY, gen_zone.maxY);
        } while (this.has(`${x}_${y}`));
        note = new Note(`${x}_${y}`, x, y, utils.randomSelect(this.theme));
        this.set(note.id, note);
        return note;
    }

    removeById(id) {
        this.delete(id);
    }
}

class Note {
    constructor(note_id, x, y, melody) {
        this.x = x;
        this.y = y;
        this.id = note_id;
        this.melody = melody;
    }
}

module.exports = NotesList;

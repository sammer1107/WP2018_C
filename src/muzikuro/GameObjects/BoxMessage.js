import Phaser from 'phaser'
import {NineSlice} from 'phaser3-nineslice'

const HORIZONTAL_PADDING = 40
const VERTICAL_PADDING = 23
const text_style = {
    fontFamily: 'Gen Jyuu Gothic P',
    fontStyle: 'bold',
    fontSize: 36,
    color: '#fefefe'
}

class BoxMessage extends Phaser.GameObjects.Container{
    constructor(scene, message){
        super(scene)
        var text, box, cam
        cam = scene.cameras.main
        text = new Phaser.GameObjects.Text(scene, 0, 0, message, text_style).setOrigin(0.5,0.5)
        box = new NineSlice(
            scene,
            {
                sourceKey: 'message_box',
                sourceLayout: {width: 25, height:25}
            },
            {
                x: 0,
                y: 0,
                width: text.width + 2*HORIZONTAL_PADDING,
                height: text.height + 2*VERTICAL_PADDING,
            }
        )
        text.setPosition(box.width/2, box.height/2)
        this.setPosition((cam.width-box.width)/2, -box.height-50)
            .add([box, text])
            .setSize(box.width, box.height)
            .setDepth(2)
            .setScrollFactor(0)
    }

    show(){
        this.scene.tweens.add({
            targets: this,
            props: {
                y: 100
            },
            duration: 150,
            ease: 'Quadratic',
        })
        return this
    }

    hide(){
        this.scene.tweens.add({
            targets: this,
            props: {
                y: -this.height-50
            },
            duration: 150,
            ease: 'Quadratic',
        })
        return this
    }

    remove(){
        this.scene.tweens.add({
            targets: this,
            props: {
                y: -this.height-50
            },
            duration: 150,
            ease: 'Quadratic',
            onComplete: this.destroy,
            callbackScope: this
        })
    }

    destroy(scene_shutdown){
        super.destroy(scene_shutdown)
    }
}

// The factory function to be registered to scene.add
export default function(message){
    return this.displayList.add(new BoxMessage(this.scene, message))
}
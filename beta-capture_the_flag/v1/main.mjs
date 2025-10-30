import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureTower } from 'game/prototypes';
import { ATTACK, ERR_NOT_IN_RANGE } from 'game/constants';
import { Flag } from 'arena/season_beta/capture_the_flag/basic';

const myTowers = getObjectsByPrototype(StructureTower).filter(i => i.my)

/**
 * @param {Creep} creep
 * @param {import('game/prototypes').BodyPartType} bodyType
 */
function has_body_type(creep, bodyType){
    return creep.body.some(bodyPart => bodyPart.type == bodyType)
}


/**
 * 
 * @param {Creep} creep 
 * @param {Flag} enemyFlag 
 */
function creepAttack(creep, enemyFlag){
    let enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)

    let closestEnemy = creep.findClosestByPath(enemyCreeps)

    if (creep.getRangeTo(closestEnemy) > 10){
        creep.moveTo(enemyFlag);
    } 

    switch (creep.attack(closestEnemy)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(closestEnemy)
                break;
        
            default:
                break;
        }
}

export function loop() {
    var enemyFlag = getObjectsByPrototype(Flag).find(object => !object.my);
    var myCreeps = getObjectsByPrototype(Creep).filter(object => object.my);

    for(var creep of myCreeps) {
        if (has_body_type(creep, ATTACK)){
            creepAttack(creep, enemyFlag)
        }
        creep.moveTo(enemyFlag);
    }

    for(var tower of myTowers){
        const closestEnemy = tower.findClosestByRange(getObjectsByPrototype(Creep).filter(i => !i.my))
        tower.attack(closestEnemy)
    }
}
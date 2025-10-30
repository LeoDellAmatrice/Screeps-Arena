import { getDirection, getObjectsByPrototype } from 'game/utils';
import { Creep, StructureTower } from 'game/prototypes';
import { ATTACK, ERR_NOT_IN_RANGE, HEAL, RANGED_ATTACK } from 'game/constants';
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

    let myHealCreep = creep.findClosestByRange(getObjectsByPrototype(Creep).filter(i => i.my).filter(i => has_body_type(i, HEAL)))

    let closestEnemy = creep.findClosestByPath(enemyCreeps)

    if (!closestEnemy){
        creep.moveTo(enemyFlag)
        return
    }

    if (creep.getRangeTo(closestEnemy) > 5){
        creep.moveTo(enemyFlag);
        creep.pull(myHealCreep)
        myHealCreep.moveTo(creep)
    } 

    switch (creep.attack(closestEnemy)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(closestEnemy)
                creep.pull(myHealCreep)
                myHealCreep.moveTo(creep)
                break;
        
            default:
                break;
        }
}


/**
 * 
 * @param {Creep} creep 
 * @param {Flag} enemyFlag 
 */
function creepRangedAttack(creep, enemyFlag){
    let enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)

    let closestEnemy = creep.findClosestByPath(enemyCreeps)

    if (!closestEnemy){
        creep.moveTo(enemyFlag)
        return
    }

    switch (creep.rangedAttack(closestEnemy)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(closestEnemy)
                break;
        
            default:
                break;
        }
}

/**
 * 
 * @param {Creep} creep 
 * @param {Flag} enemyFlag 
 */
function creepHeal(creep, enemyFlag){
    let myCreeps = getObjectsByPrototype(Creep).filter(i => i.my).filter(i => has_body_type(i, ATTACK))

    if (myCreeps.length === 0){
        creep.moveTo(enemyFlag)
        return
    }

    let closestCreep = creep.findClosestByPath(myCreeps)

    switch (creep.heal(closestCreep)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestCreep)
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
        if (has_body_type(creep, RANGED_ATTACK)){
            creepRangedAttack(creep, enemyFlag)
        }
        if (has_body_type(creep, HEAL)){
            creepHeal(creep, enemyFlag)
        }
    }

    for(var tower of myTowers){
        const closestEnemy = tower.findClosestByRange(getObjectsByPrototype(Creep).filter(i => !i.my))
        tower.attack(closestEnemy)
    }
}
import { getDirection, getObjectsByPrototype } from 'game/utils';
import { Creep, StructureTower } from 'game/prototypes';
import { ATTACK, ERR_NOT_IN_RANGE, HEAL, RANGED_ATTACK } from 'game/constants';
import { Flag } from 'arena/season_beta/capture_the_flag/basic';

const myTowers = getObjectsByPrototype(StructureTower).filter(i => i.my)

const myFlag = getObjectsByPrototype(Flag).find(i => i.my)

const creepsPair = new Map()

let firstAttackCreepId = undefined
let secondAttackCreepId = undefined


/**
 * @param {Creep} attackCreep
 */
function addCreepPair(attackCreep){

    let creepsHeal = getObjectsByPrototype(Creep).filter(i => i.my).filter(i => has_body_type(i, HEAL))

    for (let creepHeal of creepsHeal){

        if ([...creepsPair.values()].indexOf(creepHeal.id) !== -1) continue;

        creepsPair.set(attackCreep.id, creepHeal.id)
        break;

    }

}

function setPairsCreeps(){

    var myAttackCreeps = getObjectsByPrototype(Creep).filter(object => object.my).filter(i => has_body_type(i, ATTACK))

    for(var attackCreep of myAttackCreeps) {

        if (creepsPair.has(attackCreep.id)) continue;
        

        addCreepPair(attackCreep)
        if (!firstAttackCreepId){
            firstAttackCreepId = attackCreep.id
        } else if (!secondAttackCreepId){
            secondAttackCreepId = attackCreep.id
        }
    }

}

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

    let myHealCreep = getObjectsByPrototype(Creep).find(i => i.id == creepsPair.get(creep.id))

    if (!myHealCreep){
        creep.moveTo(enemyFlag)
    }

    if (creep.getRangeTo(myHealCreep) > 2){
        creep.moveTo(myHealCreep)
        return;
    }


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

    let myAttackCreeps = getObjectsByPrototype(Creep).filter(i => i.my).filter(i => has_body_type(i, ATTACK))

    if (!myAttackCreeps){
        const closestCreep = creep.findClosestByPath(getObjectsByPrototype(Creep).filter(i => i.my))
        switch (creep.heal(closestCreep)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(closestCreep)
                break;
        
            default:
                break;
        } 
        return
    }

    let attackCreepPair = getObjectsByPrototype(Creep).find(i => i.id === [...creepsPair.entries()].find(([atk, heal]) => heal === creep.id)?.[0])

    if (!attackCreepPair){
        const closestCreep = creep.findClosestByPath(getObjectsByPrototype(Creep).filter(i => i.my))
        switch (creep.heal(closestCreep)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(closestCreep)
                break;
        
            default:
                break;
        } 
        return
    }

    if (creep.hits < attackCreepPair.hits){
        creep.heal(creep)
    }

    switch (creep.heal(attackCreepPair)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(attackCreepPair)
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
function creepMyFlag(creep, enemyFlag){

    const enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)

    let myHealCreep = getObjectsByPrototype(Creep).find(i => i.id == creepsPair.get(creep.id))

    if (creep.getRangeTo(myHealCreep) > 2){
        creep.moveTo(myHealCreep)
        return;
    }

    if (!enemyCreeps){
        creep.moveTo(enemyFlag)
        creep.pull(myHealCreep)
        myHealCreep.moveTo(creep)
    }

    const closeEnemy = creep.findClosestByRange(enemyCreeps)

    if (creep.getRangeTo(closeEnemy) > 2){
        creep.moveTo(myFlag)
        creep.pull(myHealCreep)
        myHealCreep.moveTo(creep)
        return;
    }

    switch (creep.attack(closeEnemy)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closeEnemy)
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
function creepEnemyFlag(creep, enemyFlag){

    let myHealCreep = getObjectsByPrototype(Creep).find(i => i.id == creepsPair.get(creep.id))

    if (creep.getRangeTo(myHealCreep) > 2){
        creep.moveTo(myHealCreep)
        return;
    }

    const closeEnemy = creep.findClosestByRange(getObjectsByPrototype(Creep).filter(i => !i.my))
    creep.attack(closeEnemy)

    creep.moveTo(enemyFlag)
    creep.pull(myHealCreep)
    myHealCreep.moveTo(creep)

}


export function loop() {

    if (creepsPair.size==0){
        setPairsCreeps()
    }

    var enemyFlag = getObjectsByPrototype(Flag).find(object => !object.my);
    var myCreeps = getObjectsByPrototype(Creep).filter(object => object.my);

    for(var creep of myCreeps) {
        if (has_body_type(creep, ATTACK)){

            if (creep.id == firstAttackCreepId){
                creepMyFlag(creep, enemyFlag)
            } else if(creep.id == secondAttackCreepId){
                creepEnemyFlag(creep, enemyFlag)
            } else {
                creepAttack(creep, enemyFlag)
            }
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
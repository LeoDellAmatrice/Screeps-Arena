import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureContainer, StructureSpawn } from 'game/prototypes';
import { ATTACK, CARRY, ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, MOVE, RANGED_ATTACK, RESOURCE_ENERGY, TOUGH, WORK } from 'game/constants';


const mySpawn = getObjectsByPrototype(StructureSpawn).find(i => i.my)
const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my)


/**
 * @param {Creep} creep
 * @param {import('game/prototypes').BodyPartType} bodyType
 */
function has_body_type(creep, bodyType){
    return creep.body.some(bodyPart => bodyPart.type == bodyType)
}

/**
 * @param {Creep} creep
 */
function creepWork(creep){

    const resorce = getObjectsByPrototype(StructureContainer)
    const closestResorce = creep.findClosestByPath(resorce)

    if (creep.store.getFreeCapacity() === 0){

        switch (creep.transfer(mySpawn, RESOURCE_ENERGY)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(mySpawn)
                break;
        
            default:
                console.log(creep.transfer(mySpawn, RESOURCE_ENERGY))
                break;
        }

        return;
    }


    switch (creep.withdraw(closestResorce, RESOURCE_ENERGY)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestResorce)
            break;
    
        default:
            console.log(creep.withdraw(closestResorce, RESOURCE_ENERGY))
            break;
    }

}

/**
 * @param {Creep} creep
 */
function creepAttackSpawn(creep){
    
    switch (creep.attack(enemySpawn)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(enemySpawn);
            break;
    
        default:
            break;
    }

}


/**
 * @param {Creep} creep
 * @param {Creep[]} enemyCreeps
 */
function creepRangeAttack(creep, enemyCreeps){

    let closestEnemy = creep.findClosestByPath(enemyCreeps)


    switch (creep.rangedAttack(closestEnemy)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestEnemy)
            break;
        
        case ERR_INVALID_TARGET:
            creepAttackSpawn(creep)
            break;
        default:
            break;
    }
}

/**
 * @param {Creep} creep
 * @param {Creep[]} enemyCreeps
 */
function creepAttack(creep, enemyCreeps){

    let closestEnemy = creep.findClosestByPath(enemyCreeps)


    switch (creep.attack(closestEnemy)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestEnemy)
            break;
        
        case ERR_INVALID_TARGET:
            creepAttackSpawn(creep)
            break;
        default:
            break;
    }
}

export function loop() {
    let myCreeps = getObjectsByPrototype(Creep).filter(i => i.my)
    let enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)

    if (myCreeps.length < 4){
        mySpawn.spawnCreep([MOVE, CARRY, WORK])
    } else if (myCreeps.length < 14){
        mySpawn.spawnCreep([ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, TOUGH, TOUGH, TOUGH])
    }

    for (let i=0;i<myCreeps.length;i++){
        let myCreep = myCreeps[i]

        if (has_body_type(myCreep, WORK)){
            creepWork(myCreep)
        } else if (has_body_type(myCreep, ATTACK)){
            creepAttack(myCreep, enemyCreeps)
        }

    }

}
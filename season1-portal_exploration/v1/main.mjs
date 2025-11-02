import { getObjectsByPrototype } from 'game/utils';
import { Creep, StructureContainer } from 'game/prototypes';
import { WORK, ATTACK, MOVE, CARRY, RESOURCE_ENERGY, ERR_NOT_IN_RANGE, OK } from 'game/constants';
import { StructureSpawn } from 'game/prototypes/spawn';
import { Resource } from 'game/prototypes/resource';
import { Source } from 'game/prototypes/source';


const mySpawn = getObjectsByPrototype(StructureSpawn).find(i => i.my)
const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my)

/**
 * @param {Creep} creep
 * @param {import('game/prototypes/creep').BodyPartType} bodyType
 */
function has_body_type(creep, bodyType){
    return creep.body.some(bodyPart => bodyPart.type == bodyType)
}

/**
 * @param {Creep} creep
 */
function attackEnemySpawn(creep){

    switch(creep.attack(enemySpawn)){
        case ERR_NOT_IN_RANGE:
            creep.moveTo(enemySpawn)
            break;

        default:
            break;
    }

}



/**
 * @param {Creep} creep
 */
function work_creep(creep){
    
    if (creep.store.getFreeCapacity() === 0){
        if (creep.transfer(mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            creep.moveTo(mySpawn, {})
        }
        return;
    }

    let sources = getObjectsByPrototype(Source) // .filter(i => i.store.getUsedCapacity() > 0)

    let closestSource = creep.findClosestByPath(sources)
    

    switch (creep.harvest(closestSource)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestSource)
            break;

        case OK:
            return;


        default:
            console.log('Creep WORK =>', creep.harvest(closestSource))
            break;
    }

    return
}

/**
 * 
 * @param {Creep} creep
 */
function creepAttack(creep){
    let enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)

    let closestEnemy = creep.findClosestByPath(enemyCreeps)

    if (!closestEnemy){
        attackEnemySpawn(creep)
        return
    }

    if (creep.getRangeTo(closestEnemy) > 5){
        attackEnemySpawn(creep)
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

    let creeps = getObjectsByPrototype(Creep).filter(i => i.my)
    let enemyCreeps = getObjectsByPrototype(Creep).filter(i => !i.my)


    const countWorksCreeps = creeps.reduce((acc, creep) => acc + (creep.body.some(b => b.type == WORK) ? 1 : 0), 0);
    const countAttackCreeps = creeps.reduce((acc, creep) => acc + (creep.body.some(b => b.type == ATTACK) ? 1 : 0), 0);


    if (countWorksCreeps < 1){
        mySpawn.spawnCreep([MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY])
    } 
    else if (countAttackCreeps < 6) {
        mySpawn.spawnCreep([MOVE, ATTACK, MOVE, ATTACK])
    }

    for (let i=0;i<creeps.length;i++){
        let creep = creeps[i]

        if (has_body_type(creep, WORK)){
            work_creep(creep)
        }
        if (has_body_type(creep, ATTACK)){
            creepAttack(creep)
        }


    }

}
import { getObjectsByPrototype } from 'game/utils';
import { Creep, Resource, Source, StructureContainer, StructureSpawn } from 'game/prototypes';
import { ATTACK, CARRY, ERR_FULL, ERR_NOT_IN_RANGE, MOVE, OK, RESOURCE_ENERGY, WORK } from 'game/constants';

const spawn = getObjectsByPrototype(StructureSpawn).find(i => i.my)
const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my)
/**
 * @param {Creep} creep
 */
function work_creep(creep){
    let sources = getObjectsByPrototype(StructureContainer).filter(i => i.store.getUsedCapacity() > 0)

    let closestSource = creep.findClosestByPath(sources)

    if (creep.store.getFreeCapacity() === 0){
        if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            creep.moveTo(spawn)
        }
        return;
    }

    switch (creep.withdraw(closestSource, RESOURCE_ENERGY)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(closestSource)
            break;

        default:
            break;
    }

}

/**
 * @param {Creep} creep
 */
function attack_creep(creep){
    let enemys = getObjectsByPrototype(Creep).filter(i => !i.my)

    let closestEnemy = creep.findClosestByPath(enemys)

    if (creep.attack(closestEnemy) == ERR_NOT_IN_RANGE){
        creep.moveTo(closestEnemy)
        return
    } else {
        enemySpawn_attack_creep(creep)
    }
}

/**
 * @param {Creep} creep
 */
function enemySpawn_attack_creep(creep){

    if (creep.attack(enemySpawn) == ERR_NOT_IN_RANGE){
        creep.moveTo(enemySpawn)
    }
}

export function loop() {

    let creeps = getObjectsByPrototype(Creep).filter(i => i.my)

    if (creeps.length <= 2){
        spawn.spawnCreep([MOVE, WORK, CARRY]).object
    } else {
        spawn.spawnCreep([MOVE, ATTACK])
    }

    for (let i=0;i<creeps.length;i++){
        let creep = creeps[i]
        try {
            if (creep.body.some(bodyPart => bodyPart.type == WORK)){
                work_creep(creep)
            } else if (creep.body.some(bodyPart => bodyPart.type == ATTACK)){
                if (i%2==0){
                    attack_creep(creep)
                } else {
                    enemySpawn_attack_creep(creep)
                }
                
            }
        }
        catch(err){
            console.log(`Erro com o creep ${creep}:`, err);
        }
    }

    
}
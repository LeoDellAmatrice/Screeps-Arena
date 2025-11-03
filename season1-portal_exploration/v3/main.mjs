import { getObjectsByPrototype } from 'game/utils';
import { Creep } from 'game/prototypes';
import { WORK, ATTACK, MOVE, CARRY, RESOURCE_ENERGY, ERR_NOT_IN_RANGE, OK, HEAL, RANGED_ATTACK } from 'game/constants';
import { StructureSpawn } from 'game/prototypes/spawn';
import { Source } from 'game/prototypes/source';

function createGame() {

    const mySpawn = getObjectsByPrototype(StructureSpawn).find(i => i.my)
    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my)

    /**
     * @param {Creep} creep
     * @param {import('game/prototypes/creep').BodyPartType} bodyType
     */
    function has_body_type(creep, bodyType) {
        return creep.body.some(bodyPart => bodyPart.type == bodyType)
    }

    function getEnemysCreeps() {
        return getObjectsByPrototype(Creep).filter(i => !i.my)
    }


    /**
     * @param {import('game/prototypes/creep').BodyPartType} bodyType
     */
    function getMyCreeps(bodyType = undefined) {

        if (!bodyType) {
            return getObjectsByPrototype(Creep).filter(i => i.my)
        }

        return getObjectsByPrototype(Creep).filter(i => i.my).filter(i => has_body_type(i, bodyType))
    }

    function getSpawnEnergy() {
        return mySpawn.store.getUsedCapacity(RESOURCE_ENERGY)
    }


    return {
        mySpawn,
        enemySpawn,
        getEnemysCreeps,
        getMyCreeps,
        has_body_type,
        getSpawnEnergy
    }
}


/**
 * @param {{ getMyCreeps: () => Creep[]; has_body_type: (creep: Creep, bodyType: import('game/prototypes/creep').BodyPartType) => boolean }} game
 */
function createFormation(game) {

    const creepFormations = []

    function setFormations() {

        creepFormations.length = 0

        const myCreeps = game.getMyCreeps()

        const creepsAttack = myCreeps.filter(i => game.has_body_type(i, ATTACK))
        const creepsHeal = myCreeps.filter(i => game.has_body_type(i, HEAL))
        const creepsRanged = myCreeps.filter(i => game.has_body_type(i, RANGED_ATTACK))


        for (const attackCreep of creepsAttack) {

            // encontra curandeiro e atirador mais próximo do atacante que ainda não está em formação
            const heal = attackCreep.findClosestByPath(creepsHeal.filter(h => !creepFormations.some(f => f.heal && f.heal.id === h.id)))
            const ranged = attackCreep.findClosestByPath(creepsRanged.filter(r => !creepFormations.some(f => f.ranged && f.ranged.id === r.id)))

            creepFormations.push({
                attack: attackCreep,
                heal: heal ?? null,
                ranged: ranged ?? null,
            })
        }
    }


    function getFormations() {
        return creepFormations
    }


    return {
        setFormations,
        getFormations,
    }
}

/**
 * @param {{ mySpawn: StructureSpawn; enemySpawn: StructureSpawn; getEnemysCreeps: () => Creep[]; getMyCreeps: () => Creep[]; has_body_type: (creep: Creep, bodyType: import("game/prototypes/creep").BodyPartType) => boolean; }} game
 * @param {{ setFormations: () => void; getFormations: () => any[]; }} formations
 */
function createCreepsControl(game, formations) {

    function runWorkers() {
        const myCreeps = game.getMyCreeps();
        const workers = myCreeps.filter(c => game.has_body_type(c, WORK));

        for (const creep of workers) {

            if (creep.store.getFreeCapacity() === 0) {
                if (creep.transfer(game.mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(game.mySpawn);
                    continue;
                }
            }

            const sources = getObjectsByPrototype(Source);
            const target = creep.findClosestByPath(sources);

            if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
    }


    /**
     * @param {Creep} creep
     * @param {Creep | import("game/prototypes").Structure} target
     */
    function creepAtack(creep, target) {
        switch (creep.attack(target)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target)
                break;
            default:
                break;
        }
    }

    /**
     * @param {Creep} attack
     * @param {Creep} heal
     * @param {Creep | import("game/prototypes").Structure} target
     */
    function creepAtackHeal(attack, heal, target) {

        if (attack.getRangeTo(heal) > 1) {
            attack.moveTo(heal)
            heal.moveTo(attack)
            return
        }

        switch (attack.attack(target)) {
            case ERR_NOT_IN_RANGE:
                attack.moveTo(target)
                attack.pull(heal)
                heal.moveTo(attack)
                break;

            default:
                break;
        }

        if (heal.hits * 2 < attack.hits){
            heal.heal(heal)
        } else {
            heal.heal(attack)
        }
    }


    /**
     * 
     * @param {Creep} attack
     * @param {Creep} ranged
     * @param {Creep | import("game/prototypes").Structure} target
     */
    function creepAttackRanged(attack, ranged, target) {

        if (attack.getRangeTo(ranged) > 1) {
            attack.moveTo(ranged)
            ranged.moveTo(attack)
            return
        }

        switch (attack.attack(target)) {
            case ERR_NOT_IN_RANGE:
                attack.moveTo(target)
                attack.pull(ranged)
                ranged.moveTo(attack)
                break;
            default:
                break;
        }

        ranged.rangedAttack(target)

    }


    function runCombat() {
        // Atualiza as formações
        formations.setFormations();
        const creepFormations = formations.getFormations();

        // Se não houver formações, nada pra fazer
        if (creepFormations.length === 0) return;

        const enemies = game.getEnemysCreeps();
        const enemySpawn = game.enemySpawn;

        for (const formation of creepFormations) {
            const { attack, heal, ranged } = formation;
            if (!attack) continue;


            let target = attack.findClosestByPath(enemies);
            if (!target || attack.getRangeTo(target) > 6) target = enemySpawn;


            if (!heal && !ranged) {
                creepAtack(attack, target);
                continue;
            }
            if (heal && !ranged) {
                creepAtackHeal(attack, heal, target);
                continue;
            }
            if (ranged && !heal) {
                creepAttackRanged(attack, ranged, target);
                continue;
            }


            if (attack.getRangeTo(heal) > 1) {
                attack.moveTo(heal);
                heal.moveTo(attack);
                continue;
            }

            if (attack.getRangeTo(ranged) > 2) {
                attack.moveTo(ranged);
                attack.pull(heal);
                heal.moveTo(attack);
                ranged.moveTo(attack);
                continue;
            }

            // --- Ataque e suporte ---
            attack.moveTo(target);
            attack.pull(heal);
            heal.moveTo(attack);
            heal.pull(ranged);
            ranged.moveTo(heal);

            attack.attack(target);
            ranged.rangedAttack(target);


            const weightedHits = [
                { creep: heal, value: heal.hits * 2 },
                { creep: attack, value: attack.hits },
                { creep: ranged, value: ranged.hits * 2 },
            ];

            weightedHits.sort((a, b) => a.value - b.value);

            heal.heal(weightedHits[0].creep);
        }
    }

    return {
        runWorkers,
        runCombat
    }
}


const game = createGame()
const formations = createFormation(game)
const creepControl = createCreepsControl(game, formations)

export function loop() {

    const allCreeps = game.getMyCreeps()
    const countWorksCreeps = allCreeps.filter(i => game.has_body_type(i, WORK)).length
    const countAttackCreeps = allCreeps.filter(i => game.has_body_type(i, ATTACK)).length
    const countHealCreeps = allCreeps.filter(i => game.has_body_type(i, HEAL)).length
    const countRangedCreeps = allCreeps.filter(i => game.has_body_type(i, RANGED_ATTACK)).length

    if (countWorksCreeps < 1) {
        if (game.getSpawnEnergy() >= 500) {
            game.mySpawn.spawnCreep([MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY])
        }
    } else if (countAttackCreeps <= countHealCreeps) {
        if (game.getSpawnEnergy() >= 260) {
            game.mySpawn.spawnCreep([MOVE, ATTACK, MOVE, ATTACK])
        }
    } else if (countHealCreeps <= countRangedCreeps) {
        if (game.getSpawnEnergy() >= 300) {
            game.mySpawn.spawnCreep([HEAL, MOVE])
        }
    } else {
        if (game.getSpawnEnergy() >= 200) {
            game.mySpawn.spawnCreep([RANGED_ATTACK, MOVE])
        }
    }


    creepControl.runWorkers()
    creepControl.runCombat()


}
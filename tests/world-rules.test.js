/**
 * Tests for WorldRules.js - Explicit world rules for LLM consistency
 * Based on paper insights about explicit rules improving LLM accuracy by 10-15%
 */

import { WorldRules } from '../src/llm/WorldRules.js';

describe('WorldRules', () => {
  let worldRules;

  beforeEach(() => {
    worldRules = new WorldRules();
  });

  describe('getCombatRules', () => {
    test('should return combat rules with requirements', () => {
      const rules = worldRules.getCombatRules();

      expect(rules).toHaveProperty('requiresWeapon', true);
      expect(rules).toHaveProperty('skillRequired', 'Strength');
      expect(rules).toHaveProperty('minimumLevel', 5);
      expect(rules).toHaveProperty('damageCalculation');
      expect(rules).toHaveProperty('successThreshold');
    });

    test('should include weapon requirements', () => {
      const rules = worldRules.getCombatRules();

      expect(rules.weaponTypes).toContain('sword');
      expect(rules.weaponTypes).toContain('bow');
      expect(rules.weaponTypes).toContain('staff');
      expect(rules.weaponTypes).toContain('dagger');
    });

    test('should include skill requirements for different weapons', () => {
      const rules = worldRules.getCombatRules();

      expect(rules.weaponSkills).toHaveProperty('sword', 'Strength');
      expect(rules.weaponSkills).toHaveProperty('bow', 'Dexterity');
      expect(rules.weaponSkills).toHaveProperty('staff', 'Magic');
      expect(rules.weaponSkills).toHaveProperty('dagger', 'Dexterity');
    });
  });

  describe('getMagicRules', () => {
    test('should return magic rules with mana requirements', () => {
      const rules = worldRules.getMagicRules();

      expect(rules).toHaveProperty('requiresMana', true);
      expect(rules).toHaveProperty('skillRequired', 'Magic');
      expect(rules).toHaveProperty('minimumLevel', 10);
      expect(rules).toHaveProperty('manaCost');
    });

    test('should include spell requirements', () => {
      const rules = worldRules.getMagicRules();

      expect(rules.spellTypes).toContain('healing');
      expect(rules.spellTypes).toContain('damage');
      expect(rules.spellTypes).toContain('utility');
      expect(rules.spellTypes).toContain('buff');
    });

    test('should include mana costs for different spells', () => {
      const rules = worldRules.getMagicRules();

      expect(rules.spellCosts).toHaveProperty('healing', 10);
      expect(rules.spellCosts).toHaveProperty('damage', 15);
      expect(rules.spellCosts).toHaveProperty('utility', 5);
      expect(rules.spellCosts).toHaveProperty('buff', 8);
    });
  });

  describe('getTimeRules', () => {
    test('should return time-based rules', () => {
      const rules = worldRules.getTimeRules();

      expect(rules).toHaveProperty('shopsCloseAtNight', true);
      expect(rules).toHaveProperty('guardsPatrolAtNight', true);
      expect(rules).toHaveProperty('fastTravelRequiresDay', true);
      expect(rules).toHaveProperty('nightTime', '18:00-06:00');
    });

    test('should include shop hours', () => {
      const rules = worldRules.getTimeRules();

      expect(rules.shopHours).toHaveProperty('open', '08:00');
      expect(rules.shopHours).toHaveProperty('close', '18:00');
      expect(rules.shopHours).toHaveProperty('closedDays');
    });

    test('should include guard patrol schedules', () => {
      const rules = worldRules.getTimeRules();

      expect(rules.guardPatrols).toHaveProperty('night', true);
      expect(rules.guardPatrols).toHaveProperty('day', false);
      expect(rules.guardPatrols).toHaveProperty('frequency', 'every 2 hours');
    });
  });

  describe('getReputationRules', () => {
    test('should return reputation-based rules', () => {
      const rules = worldRules.getReputationRules();

      expect(rules).toHaveProperty('highEvilAffectsNPC', true);
      expect(rules).toHaveProperty('guardsAttackAbove', 70);
      expect(rules).toHaveProperty('shopsRefuseServiceAbove', 90);
      expect(rules).toHaveProperty('reputationRanges');
    });

    test('should include reputation thresholds', () => {
      const rules = worldRules.getReputationRules();

      expect(rules.reputationRanges).toHaveProperty('heroic', { min: 80, max: 100 });
      expect(rules.reputationRanges).toHaveProperty('good', { min: 60, max: 79 });
      expect(rules.reputationRanges).toHaveProperty('neutral', { min: 40, max: 59 });
      expect(rules.reputationRanges).toHaveProperty('evil', { min: 0, max: 39 });
    });

    test('should include NPC behavior based on reputation', () => {
      const rules = worldRules.getReputationRules();

      expect(rules.npcBehavior).toHaveProperty('guards');
      expect(rules.npcBehavior).toHaveProperty('merchants');
      expect(rules.npcBehavior).toHaveProperty('citizens');
      expect(rules.npcBehavior.guards).toHaveProperty('attackThreshold', 70);
    });
  });

  describe('getLocationRules', () => {
    test('should return location-specific rules', () => {
      const rules = worldRules.getLocationRules();

      expect(rules).toHaveProperty('dungeon');
      expect(rules).toHaveProperty('town');
      expect(rules).toHaveProperty('wilderness');
      expect(rules).toHaveProperty('castle');
    });

    test('should include dungeon rules', () => {
      const rules = worldRules.getLocationRules();

      expect(rules.dungeon).toHaveProperty('requiresLight', true);
      expect(rules.dungeon).toHaveProperty('dangerLevel', 'high');
      expect(rules.dungeon).toHaveProperty('monsterSpawnRate', 0.3);
    });

    test('should include town rules', () => {
      const rules = worldRules.getLocationRules();

      expect(rules.town).toHaveProperty('safe', true);
      expect(rules.town).toHaveProperty('hasShops', true);
      expect(rules.town).toHaveProperty('hasInn', true);
    });
  });

  describe('getSkillRules', () => {
    test('should return skill-based rules', () => {
      const rules = worldRules.getSkillRules();

      expect(rules).toHaveProperty('Strength');
      expect(rules).toHaveProperty('Magic');
      expect(rules).toHaveProperty('Dexterity');
      expect(rules).toHaveProperty('Intelligence');
    });

    test('should include skill requirements for actions', () => {
      const rules = worldRules.getSkillRules();

      expect(rules.Strength).toHaveProperty('combat', 5);
      expect(rules.Strength).toHaveProperty('climbing', 10);
      expect(rules.Strength).toHaveProperty('lifting', 15);
    });

    test('should include skill synergies', () => {
      const rules = worldRules.getSkillRules();

      expect(rules.synergies).toHaveProperty('Strength + Dexterity', 'combat');
      expect(rules.synergies).toHaveProperty('Magic + Intelligence', 'spellcasting');
    });
  });

  describe('getRuleForAction', () => {
    test('should return specific rule for combat action', () => {
      const rule = worldRules.getRuleForAction('combat', 'attack');

      expect(rule).toHaveProperty('requiresWeapon', true);
      expect(rule).toHaveProperty('skillRequired', 'Strength');
      expect(rule).toHaveProperty('minimumLevel', 5);
    });

    test('should return specific rule for magic action', () => {
      const rule = worldRules.getRuleForAction('magic', 'cast_spell');

      expect(rule).toHaveProperty('requiresMana', true);
      expect(rule).toHaveProperty('skillRequired', 'Magic');
      expect(rule).toHaveProperty('minimumLevel', 10);
    });

    test('should return specific rule for dialogue action', () => {
      const rule = worldRules.getRuleForAction('dialogue', 'bargain');

      expect(rule).toHaveProperty('skillRequired', 'Charisma');
      expect(rule).toHaveProperty('minimumLevel', 3);
      expect(rule).toHaveProperty('reputationModifier', true);
    });
  });

  describe('validateAction', () => {
    test('should validate combat action against rules', () => {
      const action = {
        type: 'combat',
        action: 'attack',
        weapon: 'sword',
        skill: 'Strength',
        level: 10
      };

      const isValid = worldRules.validateAction(action);

      expect(isValid).toBe(true);
    });

    test('should reject invalid combat action', () => {
      const action = {
        type: 'combat',
        action: 'attack',
        weapon: null, // No weapon
        skill: 'Strength',
        level: 10
      };

      const isValid = worldRules.validateAction(action);

      expect(isValid).toBe(false);
    });

    test('should validate magic action against rules', () => {
      const action = {
        type: 'magic',
        action: 'cast_spell',
        spell: 'healing',
        mana: 50,
        skill: 'Magic',
        level: 12
      };

      const isValid = worldRules.validateAction(action);

      expect(isValid).toBe(true);
    });

    test('should reject magic action with insufficient mana', () => {
      const action = {
        type: 'magic',
        action: 'cast_spell',
        spell: 'healing',
        mana: 5, // Insufficient mana
        skill: 'Magic',
        level: 12
      };

      const isValid = worldRules.validateAction(action);

      expect(isValid).toBe(false);
    });
  });

  describe('getRulesForLLM', () => {
    test('should return formatted rules for LLM consumption', () => {
      const llmRules = worldRules.getRulesForLLM();

      expect(llmRules).toHaveProperty('systemPrompt');
      expect(llmRules).toHaveProperty('rules');
      expect(llmRules).toHaveProperty('examples');
      expect(llmRules.systemPrompt).toContain('follow these rules');
    });

    test('should include rule examples', () => {
      const llmRules = worldRules.getRulesForLLM();

      expect(llmRules.examples).toHaveProperty('combat');
      expect(llmRules.examples).toHaveProperty('magic');
      expect(llmRules.examples).toHaveProperty('dialogue');
    });

    test('should include validation instructions', () => {
      const llmRules = worldRules.getRulesForLLM();

      expect(llmRules.systemPrompt).toContain('validate');
      expect(llmRules.systemPrompt).toContain('consistency');
      expect(llmRules.systemPrompt).toContain('rules');
    });
  });

  describe('getRuleMetrics', () => {
    test('should return rule coverage statistics', () => {
      const metrics = worldRules.getRuleMetrics();

      expect(metrics).toHaveProperty('totalRules', expect.any(Number));
      expect(metrics).toHaveProperty('ruleCategories', expect.any(Number));
      expect(metrics).toHaveProperty('coverage');
      expect(metrics.coverage).toHaveProperty('combat', expect.any(Number));
      expect(metrics.coverage).toHaveProperty('magic', expect.any(Number));
      expect(metrics.coverage).toHaveProperty('dialogue', expect.any(Number));
    });
  });

  describe('addCustomRule', () => {
    test('should add custom rule to existing category', () => {
      const customRule = {
        type: 'combat',
        action: 'special_attack',
        requiresWeapon: true,
        skillRequired: 'Strength',
        minimumLevel: 15,
        specialRequirement: 'rage_mode'
      };

      worldRules.addCustomRule(customRule);

      const rule = worldRules.getRuleForAction('combat', 'special_attack');
      expect(rule).toHaveProperty('specialRequirement', 'rage_mode');
    });

    test('should add new rule category', () => {
      const customRule = {
        type: 'crafting',
        action: 'create_item',
        requiresMaterials: true,
        skillRequired: 'Crafting',
        minimumLevel: 5
      };

      worldRules.addCustomRule(customRule);

      const rule = worldRules.getRuleForAction('crafting', 'create_item');
      expect(rule).toHaveProperty('requiresMaterials', true);
    });
  });
});

/**
 * Tests for TransitionClassifier.js - Action vs Environment transitions
 * Based on paper insights about action-driven transitions being more accurate
 */

import { TransitionClassifier } from '../src/llm/TransitionClassifier.js';
import { GameState } from '../src/core/GameState.js';

describe('TransitionClassifier', () => {
  let classifier;
  let gameState;

  beforeEach(() => {
    classifier = new TransitionClassifier();
    gameState = new GameState();
  });

  describe('classifyTransition', () => {
    test('should classify player actions as action-driven', () => {
      const action = {
        type: 'combat',
        playerChoice: 'attack',
        target: 'dragon'
      };

      const classification = classifier.classifyTransition(action, gameState);

      expect(classification.type).toBe('action-driven');
      expect(classification.requiresLLM).toBe(true);
      expect(classification.description).toContain('player');
    });

    test('should classify environment changes as environment-driven', () => {
      const action = {
        type: 'time_passage',
        duration: 60,
        automatic: true
      };

      const classification = classifier.classifyTransition(action, gameState);

      expect(classification.type).toBe('environment-driven');
      expect(classification.requiresLLM).toBe(false);
      expect(classification.description).toContain('world');
    });

    test('should classify skill checks as hybrid', () => {
      const action = {
        type: 'skill_check',
        skill: 'Strength',
        difficulty: 15,
        playerChoice: 'climb_wall'
      };

      const classification = classifier.classifyTransition(action, gameState);

      expect(classification.type).toBe('hybrid');
      expect(classification.requiresLLM).toBe(true);
      expect(classification.requiresCode).toBe(true);
    });

    test('should classify dialogue as action-driven', () => {
      const action = {
        type: 'dialogue',
        npc: 'merchant',
        playerChoice: 'bargain'
      };

      const classification = classifier.classifyTransition(action, gameState);

      expect(classification.type).toBe('action-driven');
      expect(classification.requiresLLM).toBe(true);
    });

    test('should classify time-based events as environment-driven', () => {
      const action = {
        type: 'shop_hours',
        time: 'night',
        automatic: true
      };

      const classification = classifier.classifyTransition(action, gameState);

      expect(classification.type).toBe('environment-driven');
      expect(classification.requiresLLM).toBe(false);
    });
  });

  describe('getActionRequirements', () => {
    test('should return LLM requirements for action-driven transitions', () => {
      const action = {
        type: 'combat',
        playerChoice: 'attack'
      };

      const requirements = classifier.getActionRequirements(action);

      expect(requirements).toHaveProperty('llm');
      expect(requirements.llm).toHaveProperty('promptType', 'narrative');
      expect(requirements.llm).toHaveProperty('focus', 'outcome');
      expect(requirements.llm).toHaveProperty('constraints');
    });

    test('should return code requirements for environment-driven transitions', () => {
      const action = {
        type: 'time_passage',
        duration: 60
      };

      const requirements = classifier.getActionRequirements(action);

      expect(requirements).toHaveProperty('code');
      expect(requirements.code).toHaveProperty('function', 'advanceTime');
      expect(requirements.code).toHaveProperty('parameters');
    });

    test('should return both requirements for hybrid transitions', () => {
      const action = {
        type: 'skill_check',
        skill: 'Strength',
        difficulty: 15
      };

      const requirements = classifier.getActionRequirements(action);

      expect(requirements).toHaveProperty('llm');
      expect(requirements).toHaveProperty('code');
      expect(requirements.code).toHaveProperty('function', 'rollSkillCheck');
      expect(requirements.llm).toHaveProperty('promptType', 'narrative');
    });
  });

  describe('validateTransition', () => {
    test('should validate action-driven transitions', () => {
      const action = {
        type: 'combat',
        playerChoice: 'attack',
        target: 'dragon'
      };

      const isValid = classifier.validateTransition(action, 'action-driven');

      expect(isValid).toBe(true);
    });

    test('should validate environment-driven transitions', () => {
      const action = {
        type: 'time_passage',
        duration: 60,
        automatic: true
      };

      const isValid = classifier.validateTransition(action, 'environment-driven');

      expect(isValid).toBe(true);
    });

    test('should reject mismatched classifications', () => {
      const action = {
        type: 'combat',
        playerChoice: 'attack'
      };

      const isValid = classifier.validateTransition(action, 'environment-driven');

      expect(isValid).toBe(false);
    });
  });

  describe('getTransitionRules', () => {
    test('should return rules for action-driven transitions', () => {
      const rules = classifier.getTransitionRules('action-driven');

      expect(rules).toHaveProperty('llmRequired', true);
      expect(rules).toHaveProperty('codeRequired', false);
      expect(rules).toHaveProperty('validation');
      expect(rules.validation).toContain('player choice');
    });

    test('should return rules for environment-driven transitions', () => {
      const rules = classifier.getTransitionRules('environment-driven');

      expect(rules).toHaveProperty('llmRequired', false);
      expect(rules).toHaveProperty('codeRequired', true);
      expect(rules).toHaveProperty('validation');
      expect(rules.validation).toContain('automatic');
    });

    test('should return rules for hybrid transitions', () => {
      const rules = classifier.getTransitionRules('hybrid');

      expect(rules).toHaveProperty('llmRequired', true);
      expect(rules).toHaveProperty('codeRequired', true);
      expect(rules).toHaveProperty('validation');
      expect(rules.validation).toContain('both');
    });
  });

  describe('getTransitionExamples', () => {
    test('should return examples for each transition type', () => {
      const examples = classifier.getTransitionExamples();

      expect(examples).toHaveProperty('action-driven');
      expect(examples).toHaveProperty('environment-driven');
      expect(examples).toHaveProperty('hybrid');

      expect(examples['action-driven']).toContain('combat');
      expect(examples['action-driven']).toContain('dialogue');
      expect(examples['environment-driven']).toContain('time');
      expect(examples['environment-driven']).toContain('weather');
      expect(examples['hybrid']).toContain('skill_check');
    });
  });

  describe('classifyComplexTransition', () => {
    test('should handle multi-step transitions', () => {
      const complexAction = {
        type: 'quest_completion',
        steps: [
          { type: 'combat', playerChoice: 'attack' },
          { type: 'skill_check', skill: 'Strength' },
          { type: 'dialogue', npc: 'quest_giver' }
        ]
      };

      const classification = classifier.classifyComplexTransition(complexAction);

      expect(classification.type).toBe('hybrid');
      expect(classification.steps).toHaveLength(3);
      expect(classification.steps[0].type).toBe('action-driven');
      expect(classification.steps[1].type).toBe('hybrid');
      expect(classification.steps[2].type).toBe('action-driven');
    });

    test('should determine overall classification from steps', () => {
      const mixedAction = {
        type: 'adventure',
        steps: [
          { type: 'time_passage', duration: 60 },
          { type: 'combat', playerChoice: 'attack' }
        ]
      };

      const classification = classifier.classifyComplexTransition(mixedAction);

      expect(classification.type).toBe('hybrid');
      expect(classification.requiresLLM).toBe(true);
      expect(classification.requiresCode).toBe(true);
    });
  });

  describe('getTransitionMetrics', () => {
    test('should track transition statistics', () => {
      const transitions = [
        { type: 'combat', playerChoice: 'attack' },
        { type: 'time_passage', duration: 60 },
        { type: 'skill_check', skill: 'Strength' },
        { type: 'dialogue', npc: 'merchant' }
      ];

      const metrics = classifier.getTransitionMetrics(transitions);

      expect(metrics).toHaveProperty('total', 4);
      expect(metrics).toHaveProperty('action-driven', 2);
      expect(metrics).toHaveProperty('environment-driven', 1);
      expect(metrics).toHaveProperty('hybrid', 1);
      expect(metrics).toHaveProperty('llmRequired', 3);
      expect(metrics).toHaveProperty('codeRequired', 2);
    });
  });
});

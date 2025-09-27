// Compatibility layer for classes - exports to global scope
import { 
    Task, 
    Job, 
    Skill, 
    Item, 
    Requirement, 
    TaskRequirement, 
    CoinRequirement, 
    AgeRequirement, 
    EvilRequirement 
} from '../src/entities/index.js';

// Export to global scope for compatibility
window.Task = Task;
window.Job = Job;
window.Skill = Skill;
window.Item = Item;
window.Requirement = Requirement;
window.TaskRequirement = TaskRequirement;
window.CoinRequirement = CoinRequirement;
window.AgeRequirement = AgeRequirement;
window.EvilRequirement = EvilRequirement;

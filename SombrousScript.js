var SombrousScript = SombrousScript || (function() {
    'use strict';

    var version = '0.1',
    	spellRegex = /^repeating_spell-(\d|cantrip)_([-\w]+)_spellname$/,
    	pcAttackRegex = /^repeating_attack_([-\w]+)_atkname$/,
    	pcTraitRegex = /^repeating_traits_([-\w]+)_name$/,
    	npcActionRegex = /^repeating_npcaction_([-\w]+)_name$/,
    	npcReactionRegex = /^repeating_npcreaction_([-\w]+)_name$/,
    	npcTraitRegex = /^repeating_npctrait_([-\w]+)_name$/,
    	spellslotRegex = /^lvl(\d)_slots_total$/,
    	ch = function (c) {
        		var entities = {
        			'<' : 'lt',
        			'>' : 'gt',
        			"'" : '#39',
        			'@' : '#64',
        			'{' : '#123',
        			'|' : '#124',
        			'}' : '#125',
        			'[' : '#91',
        			']' : '#93',
        			'"' : 'quot',
        			'-' : 'mdash',
        			' ' : 'nbsp'
        		};
        
        		if(_.has(entities,c) ){
        			return ('&'+entities[c]+';');
        		}
        		return '';
        	},
        showHelp = function(who, isKeyArgument) {
            if (isKeyArgument) {
                sendChat('GM', '/w "'+who+'"Please use a valid identifiers.');
            }
            else {
                sendChat('GM', '/w "'+who+'" Please select a character token and try again.');
            }
        },
    
        logAttributes = function(who, character) {
          var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            _.each(characterAttributes, function(obj) {    
                var logmsg = obj.get("name") + ":" + obj.get("current");
                if (obj.get("max") != "") {
                    logmsg += " (" + obj.get("max") + ")";
                }
                logmsg += " " + obj.id;
                log(logmsg);
            });
            sendChat('GM', '/w "'+who+'" All attributes logged.');
        },
        
        deleteAttribute = function(who, attrid) {
            var attr = getObj("attribute", attrid);
            if (attr) {
                attr.remove();
                sendChat('GM', '/w "'+who+'" Attribute has been removed.');
            }
            else {
                sendChat('GM', '/w "'+who+'" Attribute could not be found.');
            }
        },
    
        emitSpellLevel = function(characterid, level) {
            if (level == "cantrip") {
                return 'Cantrips (at will): ';
            }
            else {
                return 'Level ' + level + ' (' + getAttrByName(characterid, 'lvl' + level + '_slots_expended') + ' / ' + getAttrByName(characterid, 'lvl' + level + '_slots_total') + '): ';
            }
        },
    
        buildSpellList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var spells = _.chain(characterAttributes)
                .filter(function (a) {
                    return spellRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = spellRegex.exec(a.get("name"));
                    return {
                        id: match[2],
                        level: match[1],
                        name: a.get("current")
                    }
                })
                .sortBy(function (s) {
                    if (s.level == "cantrip") return "0";
                    else return s.level;
                })
                .value();
                
            if (spells.length == 0) {
                msg += 'This character has no spells.';
            }
            else {
                var currentLevel = '';
                _.each(spells, function(s) {
                    if (s.level !== currentLevel) {
                        if (currentLevel !== '') {
                            msg += '\n\n';
                        }
                        
                        currentLevel = s.level;
                        msg += emitSpellLevel(character.id, s.level);
                    }
                    
                    msg += '[' + s.name + '](~' + character.id + '|repeating_spell-' + s.level + '_' + s.id + '_spell) ';
                })
            }
            
            return msg;
        },    
        
        buildPcAttackList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var attacks = _.chain(characterAttributes)
                .filter(function (a) {
                    return pcAttackRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = pcAttackRegex.exec(a.get("name"));
                    return {
                        id: match[1],
                        name: a.get("current")
                    }
                })
                .value();
                
            if (attacks.length == 0) {
                msg += 'This character has no attacks or actions.';
            }
            else {
                _.each(attacks, function(a) {
                    msg += '[' + a.name + '](~' + character.id + '|repeating_attack_' + a.id + '_attack) ';
                })
            }
            
            return msg;
        },    
        
        buildPcTraitList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var traits = _.chain(characterAttributes)
                .filter(function (a) {
                    return pcTraitRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = pcTraitRegex.exec(a.get("name"));
                    return {
                        id: match[1],
                        name: a.get("current")
                    }
                })
                .value();
                
            if (traits.length == 0) {
                msg += 'This character has no traits.';
            }
            else {
                _.each(traits, function(a) {
                    msg += '[' + a.name + '](!showpctrait '+ character.id + ' ' + a.id + ') ';
                })
            }
            
            return msg;
        },    
        
        buildNpcActionList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var attacks = _.chain(characterAttributes)
                .filter(function (a) {
                    return npcActionRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = npcActionRegex.exec(a.get("name"));
                    return {
                        id: match[1],
                        name: a.get("current")
                    }
                })
                .value();
                
            if (attacks.length == 0) {
                msg += 'This character has no actions.';
            }
            else {
                _.each(attacks, function(a) {
                    msg += '[' + a.name + '](~' + character.id + '|repeating_npcaction_' + a.id + '_npc_action) ';
                })
            }
            
            return msg;
        },    
        
        buildNpcTraitList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var traits = _.chain(characterAttributes)
                .filter(function (a) {
                    return npcTraitRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = npcTraitRegex.exec(a.get("name"));
                    return {
                        id: match[1],
                        name: a.get("current")
                    }
                })
                .value();
                
            _.each(traits, function(a) {
                msg += '[Trait: ' + a.name + '](!shownpctrait ' + character.id + ' ' + a.id + ') ';
            })
            
            return msg;
        },    
        
        buildNpcReactionList = function(character) {
            var msg = '';
            
            var characterAttributes = findObjs({                              
                _type: "attribute",
                _characterid: character.id
            });
            
            var reactions = _.chain(characterAttributes)
                .filter(function (a) {
                    return npcReactionRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = npcReactionRegex.exec(a.get("name"));
                    return {
                        id: match[1],
                        name: a.get("current")
                    }
                })
                .value();
                
            _.each(reactions, function(a) {
                msg += '[Reaction: ' + a.name + '](!shownpcreaction ' + character.id + ' ' + a.id + ') ';
            })
            
            return msg;
        },   
        
        showPcSpellList = function(who, character) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+getAttrByName(character.id,'character_name')+'}} {{name=}} {{description=';
    
            msg += buildSpellList(character);
            
            msg += '}}'
            
            sendChat('GM', msg);
        },
        
        showNpcSpellList = function(who, character, token) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+token.get("name")+'}} {{name=}} {{description=';
            if (getAttrByName(character.id, 'npcspellcastingflag') !== "1") {
                msg += 'This character is not a spellcaster.'
            }
            else {
                msg += buildSpellList(character);
            }
            
            msg += '}}'
            
            sendChat('GM', msg);
        },
        
        showPcAttackList = function(who, character) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+getAttrByName(character.id,'character_name')+'}} {{name=}} {{description=';
    
            msg += buildPcAttackList(character);
            
            msg += '}}'
            
            sendChat('GM', msg);
        },
        
        showNpcAttackList = function(who, character, token) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+token.get("name")+'}} {{name=}} {{description=';
            
            msg += buildNpcActionList(character);
            
            msg += '}}'
            
            sendChat('GM', msg);
        },    
        
        showPcTraitList = function(who, character) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+getAttrByName(character.id,'character_name')+'}} {{name=}} {{description=';
    
            msg += buildPcTraitList(character);
            
            msg += '}}'
            
            sendChat('GM', msg);
        },
        
        showPcTrait = function(who, characterid, traitid) {
            var msg = '/w "' + who + '" &{template:traits} {{name=';
                msg += getAttrByName(characterid, 'repeating_traits_' + traitid + '_name') + '}} {{source=';
                msg += getAttrByName(characterid, 'repeating_traits_' + traitid + '_source') + ': ';
                msg += getAttrByName(characterid, 'repeating_traits_' + traitid + '_source_type') + '}} {{description=';
                msg += getAttrByName(characterid, 'repeating_traits_' + traitid + '_description') + '}}) ';     
            sendChat('GM', msg);
        },
        
        showNpcTraitList = function(who, character, token) {
            var msg = '/w "'+who+'" &{template:npcaction} {{rname='+token.get("name")+'}} {{name=}} {{description=';
            
            msg += buildNpcTraitList(character);
            msg += buildNpcReactionList(character);
            
            msg += '}}'
            
            sendChat('GM', msg);
        },        
        
        showNpcTrait = function(who, characterid, traitid) {
            var msg = '/w "' + who + '" &{template:npcaction} {{rname=';
                msg += getAttrByName(characterid, 'repeating_npctrait_' + traitid + '_name') + '}} {{description=';
                msg += getAttrByName(characterid, 'repeating_npctrait_' + traitid + '_desc') + '}}) ';     
            sendChat('GM', msg);
        },
        
        showNpcReaction = function(who, characterid, reactionid) {
            var msg = '/w "' + who + '" &{template:npcaction} {{rname=';
                msg += getAttrByName(characterid, 'repeating_npcreaction_' + reactionid + '_name') + '}} {{description=';
                msg += getAttrByName(characterid, 'repeating_npcreaction_' + reactionid + '_desc') + '}}) ';     
            sendChat('GM', msg);
        },
        
        getSelectedCharacterToken = function(msg) {
    		if(!_.has(msg,'selected')) return null;
            
            var tokens = _.chain(msg.selected)
                .map(function(o) {
                    return getObj(o._type, o._id);
                })
                .filter(function(o) {
                    return o.get("_type") == "graphic"
                        && o.get("_subtype") == "token"
                        && o.get("represents") != "";
                })
                .reject(_.isUndefined)
                .value();
            if (tokens.length == 0) {
                return null;
            }
            
            return tokens[0];
        },
        
        getTokenCharacter = function(token) {
            if (!token) return null;
            
            return getObj("character", token.get("represents"));
        },
        
        isNpc = function(character) {
            return getAttrByName(character.id, "npc") == "1";  
        },
    	
    	refreshCharacter = function(character, token, onlyShortRest) {
    	    var characterAttrs = findObjs({                              
                    _type: "attribute",
                    _characterid: character.id
                });
            var spellSlots = _.chain(characterAttrs)
                .filter(function (a) {
                    return spellslotRegex.test(a.get("name"));
                })
                .map(function (a) {
                    var match = spellslotRegex.exec(a.get("name"));
                    return {
                        level: match[1],
                        attr: a
                    }
                })
                .value();
            _.each(spellSlots, function (x) {
                var attrName = 'lvl' + x.level + '_slots_expended';
                var expendedAttr = findObjs({
                   _type: "attribute",
                   _characterid: character.id,
                   name: attrName
                });
                
                if (expendedAttr.length == 0) {
                    createObj("attribute", {
                        name: attrName,
                        current: x.attr.get('current'),
                        characterid: character.id
                    });
                }
                else {
                    expendedAttr[0].set('current', x.attr.get('current'));
                }
            });
            
            var hpAttr = findObjs({                              
                    _type: "attribute",
                    _characterid: character.id,
                    name: 'hp'
                })[0];        
            hpAttr.set('current', hpAttr.get('max'));
            token.set('bar1_value', token.get('bar1_max'));
            
    	    if (!isNpc(character)) {
                var hitDiceAttr = findObjs({                              
                        _type: "attribute",
                        _characterid: character.id,
                        name: 'hit_dice'
                    })[0];
                var hitDiceMax = parseInt(hitDiceAttr.get("max"));
                var hitDiceCurrent = parseInt(hitDiceAttr.get("current"));
                var potentialHitDice = Math.max(Math.floor(hitDiceMax / 2), 1);
                var missingHitDice = hitDiceMax - hitDiceCurrent;
                hitDiceAttr.set("current", Math.min(hitDiceCurrent + Math.min(potentialHitDice, missingHitDice), hitDiceMax));
                
    	        sendChat('GM', '/w "' + getAttrByName(character.id, 'character_name') + '" You awake from your long rest feeling refreshed.');
    	        sendChat('GM', '/w gm ' + getAttrByName(character.id, 'character_name') + ' wakes up from a long rest feeling refreshed.');
    	    }
    	},
    	
    	handleInput = function(msg) {
    		var args,who,token,character;
    
            switch (msg.type) {
                case 'api': {
                    who=getObj('player',msg.playerid).get('_displayname');
                    args = msg.content.split(" ");
                    
            		switch(args[0]) {
            		    case '!attr': {
            			    token = getSelectedCharacterToken(msg);
            			    character = getTokenCharacter(token);
            			    if (!character) {
            			        showHelp(who);
            					return;
            			    }
            			    else {
            			        logAttributes(who, character);
            			    }
            			            		        
            		        break;
            		    }
            		    case '!delattr': {
            		        deleteAttribute(who, args[1]);
            		        break;
            		    }
            		    case '!longrestplus': {
            			    token = getSelectedCharacterToken(msg);
            			    character = getTokenCharacter(token);
            			    if (!character) {
            			        showHelp(who);
            					return;
            			    }
            			    else {
            			        refreshCharacter(character, token);
            			    }
            			    
            		        break;
            		    }
            			case '!spelllist': {
            			    token = getSelectedCharacterToken(msg);
            			    character = getTokenCharacter(token);
            			    if (!character) {
            			        showHelp(who);
            					return;
            			    }
            			    else if (isNpc(character)) {
            			        showNpcSpellList(who, character, token);
            			    }
            			    else {
            			        showPcSpellList(who, character);
            			    }
            			    
        				    break;
            			}
            			case '!attacklist': { 
            			    token = getSelectedCharacterToken(msg);
            			    character = getTokenCharacter(token);
            			    if (!character) {
            			        showHelp(who);
            					return;
            			    }
            			    else if (isNpc(character)) {
            			        showNpcAttackList(who, character, token);
            			    }
            			    else {
            			        showPcAttackList(who, character);
            			    }
            			    
            			    break;
            			}
            			case '!traitlist': {
            			    token = getSelectedCharacterToken(msg);
            			    character = getTokenCharacter(token);
            			    if (!character) {
            			        showHelp(who);
            					return;
            			    }
            			    else if (isNpc(character)) {
            			        showNpcTraitList(who, character, token);
            			    }
            			    else {
            			        showPcTraitList(who, character);
            			    }        			    
            			    
            			    break;
            			}
            			case '!showpctrait': {
		                    if (args.length < 3) {
            			        showHelp(who, true);
            			        return;
            			    }
            			    
            			    showPcTrait(who, args[1], args[2]);
            			    
            			    break;
            			}
            			case '!shownpctrait': {
		                    if (args.length < 3) {
            			        showHelp(who, true);
            			        return;
            			    }
            			    
            			    showNpcTrait(who, args[1], args[2]);
            			    
            			    break;
            			}
            			case '!shownpcreaction': {
		                    if (args.length < 3) {
            			        showHelp(who, true);
            			        return;
            			    }
            			    
            			    showNpcReaction(who, args[1], args[2]);
            			    
            			    break;
            			}            			
    		        }
                    break;
                }
            }
    	},
    
    	handleChangeGraphic = function(obj) {
            if(obj.get("bar1_max") === "") return;
           
            if(obj.get("bar1_value") <= obj.get("bar1_max") / 2) {
                obj.set({
                      status_redmarker: true
                });
            }
            else{
                obj.set({
                    status_redmarker: false
                })
            }
        
            if(obj.get("bar1_value") <= 0) {
              obj.set({
                 status_dead: true
              });
            }
            else {
              obj.set({
                status_dead: false
              });
            }
    	},
    
    	registerEventHandlers = function() {
    		on('change:graphic', handleChangeGraphic);
    		on('chat:message', handleInput);
    	};
    
    	return {
    		RegisterEventHandlers: registerEventHandlers
    	};
}());

on("ready",function(){
	'use strict';

	SombrousScript.RegisterEventHandlers();
});

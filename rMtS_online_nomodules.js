/******************** 
 * Rmts_Online Test *
 ********************/

import { PsychoJS } from './lib/core-2020.1.js';
import * as core from './lib/core-2020.1.js';
import { TrialHandler } from './lib/data-2020.1.js';
import { Scheduler } from './lib/util-2020.1.js';
import * as util from './lib/util-2020.1.js';
import * as visual from './lib/visual-2020.1.js';
import * as sound from './lib/sound-2020.1.js';

const completionUrl="https://surrey-uk.sona-systems.com/webstudy_credit.aspx?experiment_id=967&credit_token=e3edbcc7a6714978819b7f5dbd0c374e&survey_code=VAR_participant";

function inRange(x, min, max) {
  return ((x-min)*(x-(max-1)) <= 0);
}

function isin(v,test_a) {
  return math.matrix(v).toArray().map(x => math.matrix(test_a).toArray().includes(x))
}

function linspace(start,stop,num){
  let out = []
  let delta = (stop - start)/(num-1)
  math.range(0,num).toArray().map(i => out.push(start+i*delta))
  return out
}

function permutation(a1) {
  let a2 = math.matrix(a1)
  for (let i = a2.size() - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      a2.subset(math.index([i,j]),a2.subset(math.index([j,i])))
  }
  return a2.toArray();
}

function getPID(pidLength=8) {
  let pid = ""
  const PIDCHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
  for (let i = 0; i < pidLength; i++) { pid = pid.concat((PIDCHARS[Math.round(Math.random()*PIDCHARS.length)])) }
  return pid.replace(/undefined/g,'X')
}

function generate_jitter(rJitter, nJitter, tolJitter) {
  let jitter = math.random([1, nJitter], rJitter[0], rJitter[1]);
  while ((! ((math.mean(jitter) >= (math.mean(rJitter) - tolJitter)) && (math.mean(jitter) <= (math.mean(rJitter) + tolJitter))))) {
      jitter = math.random([1, nJitter], rJitter[0], rJitter[1]);
  }
  return jitter[0];
}

function get_neighbor(gridXY, loc) {
  let m, pos;
  m = math.reshape(math.range(0,Math.pow(gridXY, 2)),[gridXY, gridXY]);
  pos = [Number.parseInt((loc / gridXY)), Number.parseInt((loc % gridXY))];
  let coord = math.setCartesian([-1, 0, 1],[-1, 0, 1])
  coord = coord.filter(x => x[0]*x[1] === 0)
  coord = coord.filter(x => inRange(pos[0]+x[0],0,m.size()[0]) && inRange(pos[1]+x[1],0,m.size()[1]))
  return coord.map(x => m.subset(math.index(pos[0]+x[0], pos[1]+x[1])))
}

const indComplexity = 100

function generate_sample(gridXY,sampleNum,neighborNumber=1,complexity=1) {
  const ind = math.range(0,Math.pow(gridXY, 2))
  const orig = math.matrix(ind.map(ind => math.randomInt(complexity)*indComplexity+ind))
  let avail = ind.toArray()
  const doNeighbor = math.pickRandom(math.range(1, sampleNum), neighborNumber);

  // sample
  let sample = Array(), avail1, item
  while (sample.length < sampleNum && avail.length > 0) {
      if (isin(doNeighbor, [sample.length]).some(x => x)) {
          avail1 = get_neighbor(gridXY, sample[sample.length-1]);
          avail1.splice(avail1.indexOf(sample[sample.length-1]),1);
          item = math.pickRandom(avail1);
      } else {
          item = math.pickRandom(avail);
      }
      sample.push(item);
  get_neighbor(gridXY,item).filter(x => isin(avail,[x])).map(x => avail.splice(avail.indexOf(x),1))
  } 
  
  // non-sample
  avail = [...new Set(sample.map(x => get_neighbor(gridXY,x)).flat())]
  sample.map(x => avail.splice(avail.indexOf(x),1))
  avail = math.matrix(math.concat(sample, math.pickRandom(avail,sample.length)))
  
  return [orig.subset(math.index(sample)).toArray(), permutation(avail)]
}

function rotateCoord(xy, deg) {
  return [math.dot(xy, [math.cos(math.unit(deg,'deg')), math.sin(math.unit(deg,'deg'))]), math.dot(xy, [-math.sin(math.unit(deg,'deg')), math.cos(math.unit(deg,'deg'))])];
}

class ArrayStim {
  
  constructor({win, nElements = 1, sizes = 100, xys = [[0, 0]], oris = [], elementFill = true, elementMask = 'circle', colors = [1, 1, 1], autoLog = false}) {

      this.tStart = undefined;
      this.tStop = undefined;
      this.tStartRefresh = undefined;
      this.tStopRefresh = undefined;
      this.frameNStart = undefined;
      this.frameNStop = undefined;

      this.Elements= [];

      
      colors = math.matrix(colors).toArray();
  
      switch(elementMask) {
        case 'circle':
          if (elementFill) {
              math.range(0,nElements).toArray().map(i => this.Elements.push(new visual.Polygon({
                  win: win, pos: xys[i], radius: (sizes / 2), edges: 32, units: 'pix', 
                  lineColor: new util.Color(colors), fillColor: new util.Color(colors), 
                  autoLog: autoLog
                  })));
          } else {
              math.range(0,nElements).toArray().map(i => this.Elements.push(new visual.Polygon({
                  win: win, pos: xys[i], radius: (sizes / 2), edges: 32, units: 'pix', 
                  lineColor: new util.Color(colors), 
                  autoLog: autoLog
                  })));
          }
          break;
        case 'line':
              math.range(0,nElements).toArray().map(i => this.Elements.push(new visual.ShapeStim({
                  win: win, vertices: [math.subtract(xys[i], rotateCoord([(sizes[0] / 2), 0], oris[i])), math.add(xys[i], rotateCoord([(sizes[0] / 2), 0], oris[i]))], lineWidth: sizes[1], units: 'pix', 
                  lineColor: new util.Color(colors), autoLog: autoLog, closeShape: false
                  })));
          break;
      }
      
  }
  
  get status() {
      return this.Elements[0].status
  }
  
  set status(val) {
      for (let i = 0; i < this.Elements.length; i++) {
          this.Elements[i].status = val;
      }
  }
  
  setAutoDraw(toDraw) {
      return this.Elements.map(x => x.setAutoDraw(toDraw));
  }
}

// localisation
function msgParse(msg) {
    for ( let v of [...new Set(msg.match(/VAR_[a-zA-Z]*/g))]) {
        msg = msg.replace(eval("/" + v + "/gi"),eval(v.replace('VAR_','')).toString());
    }
    return msg
}
let lng = window.icu.getLanguage(); // en, de, hu, zh, pt, es
if (Object.keys(window).includes(lng)) {
  lng = eval(lng);
  for (let f of Object.keys(en)) {
    if (!lng.hasOwnProperty(f)) { lng[f] = en[f] }
  }
} else {
  lng = en
}
_.setTranslation(lng);

// init psychoJS:
const psychoJS = new PsychoJS({
  debug: false
});

// open window:
psychoJS.openWindow({
  fullscr: true,
  color: new util.Color([0, 0, 0]),
  units: 'pix',
  waitBlanking: true
});

// store info about the experiment session:
let expName = _('experiment_name');  // from the Builder filename that created this script
let expInfo = {}
expInfo['participant'] = ''
expInfo['session'] = '1'
expInfo['run'] = 0
expInfo['grid size'] = '6'
expInfo['sample size'] = '4'
expInfo['sample retention time'] = '1'
expInfo['match type'] = ['single', 'multi']
expInfo['match number'] = '2'

let participant
let nMaxTrain = 2 // maximum 2 traning run
let nSampleTrain = 5 // 5 sample per training run
let critTrainPerf = 60 // until performance < 60%
let nMaxTest = 1 // maximum 1 testing/real run

let nMaxRun = nMaxTrain + nMaxTest
let startedTest = false// signal for test
let performance = 0, nCorrect = 0, nTotal = 0
let finishedTrain = false

let onlineExpInfo = {}

onlineExpInfo[_('dem_gender_q')+'*'] = _('dem_gender_a')
onlineExpInfo[_('dem_gender_o')] = ''
onlineExpInfo[_('dem_age_q')+'*'] = math.range(18,100).toArray().map(String)
onlineExpInfo[_('dem_nat_q')+'*'] = Object.values(_('countries'))
onlineExpInfo[_('dem_res_q')+'*'] = Object.values(_('countries'))
onlineExpInfo[_('dem_firstlang_q')+'*'] = Object.values(_('languages'))
onlineExpInfo[_('dem_alllang_q')+'*'] = math.range(1,100).toArray().map(String)
onlineExpInfo[_('dem_edu_q')+'*'] = _('dem_edu_a')

  // schedule the experiment:
psychoJS.schedule(  psychoJS.gui.DlgFromDict({
  text: _('dem_text'),
  dictionary: onlineExpInfo,
  title: expName
}));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function() { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); 
nextRun(flowScheduler)

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);

let resources = [
  {'name':'optionlist', 'path':'./resources/optionlist.tsv'}
]
for (let r = 0; r < en.instruction.length; r++) {
  resources.push({'name':'flow'.concat(r.toString()), 'path':'./resources/flow'.concat(r.toString(),'.jpg')})
}

psychoJS.start({
  expName: expName,
  expInfo: expInfo,
  resources: resources
});

function updateInfo() {
  // update expInfo from onlineExpInfo with translation
  expInfo[en['dem_gender_q']] = en["dem_gender_a"][Object.keys(lng["dem_gender_a"]).find(key => lng["dem_gender_a"][key] == onlineExpInfo[_('dem_gender_q')+'*'])]
  expInfo[en['dem_gender_o']] = onlineExpInfo[_('dem_gender_o')]
  expInfo[en['dem_age_q']] = onlineExpInfo[_('dem_age_q')+'*']
  expInfo[en['dem_nat_q']] = en["countries"][Object.keys(lng["countries"]).find(key => lng["countries"][key] == onlineExpInfo[_('dem_nat_q')+'*'])]
  expInfo[en['dem_res_q']] = en["countries"][Object.keys(lng["countries"]).find(key => lng["countries"][key] == onlineExpInfo[_('dem_res_q')+'*'])]
  expInfo[en['dem_firstlang_q']] = en["languages"][Object.keys(lng["languages"]).find(key => lng["languages"][key] == onlineExpInfo[_('dem_firstlang_q')+'*'])]
  expInfo[en['dem_alllang_q']] = onlineExpInfo[_('dem_alllang_q')+'*']
  expInfo[en['dem_edu_q']] = en["dem_edu_a"][Object.keys(lng["dem_edu_a"]).find(key => lng["dem_edu_a"][key] == onlineExpInfo[_('dem_edu_q')+'*'])]
  
  expInfo['date'] = util.MonotonicClock.getDateStr();  // add a simple timestamp
  expInfo['expName'] = expName;
  expInfo['psychopyVersion'] = '2020.1.3';
  expInfo['OS'] = window.navigator.platform;

  // store frame rate of monitor if we can measure it successfully
  expInfo['frameRate'] = psychoJS.window.getActualFrameRate();

  // update expInfo from an option set randomly selected from 'optionlist'
  let opts = d3.tsvParse(psychoJS.serverManager.getResource('optionlist'));
  opts = opts[Math.floor(opts.length*Math.random())];
  for (let f of Object.keys(opts)) {
    expInfo[f.replace(/_/g,' ')] = opts[f]
  }
    
  // add info from the URL:
  util.addInfoFromUrl(expInfo);

  if (expInfo['participant'].length == 0) { expInfo['participant'] = getPID() }
  participant = expInfo['participant']
  psychoJS.gui.dialog({
    message: msgParse(_('infoID')),
    showOK: true
  });

  psychoJS.setRedirectUrls(msgParse(completionUrl),undefined) 

  return Scheduler.Event.NEXT;
}

function nextRun(scheduler) {
  finishedTrain = (performance >= critTrainPerf) | (expInfo['run'] >= nMaxTrain)
  if (finishedTrain & !startedTest) { 
    nMaxRun = expInfo['run'] + nMaxTest
    startedTest = true
  }
  if (!finishedTrain | (expInfo['run'] < nMaxRun)) {
    scheduler.add(experimentInit);
    const loopInstructionLoopScheduler = new Scheduler(psychoJS);
    scheduler.add(loopInstructionLoopBegin, loopInstructionLoopScheduler);
    scheduler.add(loopInstructionLoopScheduler);
    scheduler.add(loopInstructionLoopEnd);
    const loopDummiesLoopScheduler = new Scheduler(psychoJS);
    scheduler.add(loopDummiesLoopBegin, loopDummiesLoopScheduler);
    scheduler.add(loopDummiesLoopScheduler);
    scheduler.add(loopDummiesLoopEnd);
    const loopSampleLoopScheduler = new Scheduler(psychoJS);
    scheduler.add(loopSampleLoopBegin, loopSampleLoopScheduler);
    scheduler.add(loopSampleLoopScheduler);
    scheduler.add(loopSampleLoopEnd);
    scheduler.add(endRoutineBegin());
    scheduler.add(endRoutineEachFrame());
    scheduler.add(endRoutineEnd());
    scheduler.add(quitPsychoJS, '', true);
  }
}

let sampleNum, totalTime, meanMatchJitter;
let instructionClock, instructionComponents, instructionText, instructionImage, instructionKey, _instructionKey_allKeys;
let dummyClock, dummyComponents, dummyDuration, dummyText;
let thisSample, sampleClock, sampleComponents, sampleDuration, sampleBackground, sampleForm;
let fillerDuration, fillerForm;
let thisMatch, matchClock, matchComponents, matchBackground, matchForm, matchKey, _matchKey_allKeys, responseDuration, responseStim;
let endClock, endComponents, endText_feedback, endText_farewell, endKey, _endKey_allKeys;
let nInstruction = en.instruction.length, nDummies, nMatch, nSample, loopInstruction, loopDummies, loopSample, loopMatch;
let globalClock, routineTimer, t, frameN, tGlobal, tRemains, jitter;
let bYes, bNo, bYesInst, bNoInst, cellCoordinates, colour, gridForm, sampleSize, sampleTrials;

function experimentInit() {
  // Initialize components for Routine "instruction"
  var gridAngles, gridCoordinates, gridSize, gridXY, indReplace, letterHeight, match, matchJitter, matchJitterRange, matchTrials, poolReplace, responseJitter, responseJitterRange, sampleJitter, sampleJitterRange, tolJitter;
  
  expInfo['run'] += 1

  nDummies = 3;
  dummyDuration = 1;
  
  matchJitter = JSON.parse(expInfo['sample retention time']);
  if (!Array.isArray(matchJitter)) { matchJitter = [matchJitter] };
  matchJitter = permutation(new Array(nSample = JSON.parse(expInfo['sample number'])).fill(matchJitter).flat());
  nSample = matchJitter.length;
  sampleJitterRange = [0.25, 0.75];
  sampleDuration = 0.5;
  nMatch = Number.parseInt(expInfo["match number"]);
  matchJitterRange = [-0.5, 0.5]; // delta
  fillerDuration = 0.25;
  responseJitterRange = [0, 0];
  responseDuration = 1;
  sampleNum = Number.parseInt(expInfo["sample size"]);
  tolJitter = 0.001;
  sampleJitter = generate_jitter(sampleJitterRange, nSample, tolJitter);
  matchJitter = math.add(matchJitter,generate_jitter(matchJitterRange, nSample, tolJitter));
  responseJitter = generate_jitter(responseJitterRange, (nSample * nMatch), tolJitter);
  
  if (!finishedTrain) {
    nSample = nSampleTrain;
    matchJitter = new Array(nSample).fill(3) // mean retention time 3s
    matchJitter = math.add(matchJitter,generate_jitter([-1, 1], nSample, tolJitter)); // retention time jitters +/-1s
    responseDuration = 2;
  }

  totalTime = Math.ceil(nSample*(
    math.mean(sampleJitter) + sampleDuration + math.mean(matchJitter) + nMatch*(
      sampleDuration + math.mean(responseJitter) + responseDuration
      )
    )/60);

  gridSize = 0.8; // grid height relative to the viewport
  gridSize = window.screen.availHeight*gridSize;
  gridXY = Number.parseInt(expInfo["grid size"]);
  colour = math.matrix([-0.5, -0.5, -0.5]);
  sampleSize = 0.9; // sample size relative to cell
  sampleSize = (gridSize / gridXY) * sampleSize;
  cellCoordinates = ((gridSize / gridXY) * (gridXY - 1)) / 2;
  cellCoordinates = math.setCartesian(linspace(-cellCoordinates,cellCoordinates,gridXY),linspace(-cellCoordinates,cellCoordinates,gridXY))
  gridCoordinates = math.concat(linspace(-gridSize/2,gridSize/2,gridXY+1).map(x => [x,0]),linspace(-gridSize/2,gridSize/2,gridXY+1).map(x => [0,x]),0)
  gridAngles = math.concat(math.range(0,gridXY + 1).map(i => 90),math.range(0,gridXY + 1).map(i => 0)).toArray()
  letterHeight = Math.round(gridSize*0.04);

  bYes = "left"; bYesInst = "<-";
  bNo = "right"; bNoInst = "->";

  sampleTrials = [];
  sampleJitter = permutation(sampleJitter);
  matchJitter = permutation(matchJitter);
  responseJitter = permutation(responseJitter);
  let sampleSelection, allSelection
  for (var s = 0; s < nSample; s += 1) {
      [sampleSelection, allSelection] = generate_sample(gridXY, sampleNum, 1);
      sampleTrials.push({"onsetSample": sampleJitter[s], "sample": sampleSelection, "onsetMatch": matchJitter[s]});
      matchTrials = [];
      for (var m = 0; (m < nMatch); m += 1) {
          if ((expInfo["match type"] === "single")) {
              match = allSelection.slice(m, (m + 1));
          } else {
              if ((expInfo["match type"] === "multi")) {
                  match = sampleSelection.slice();
                  indReplace = (Math.floor((Math.random() * ((sampleNum - 0) + 1))) + 0);
                  poolReplace = get_neighbor(gridXY, match[indReplace]).filter(i => math.not(isin([i],match))[0]);
                  math.range(0,poolReplace.length).map(i => poolReplace.push(match[indReplace]))
                  match[indReplace] = math.pickRandom(poolReplace);
              }
          }
          matchTrials.push({"match": match, "onsetResponse": responseJitter[((s * nMatch) + m)]});
      }
      sampleTrials.slice((- 1))[0]["matchTrials"] = matchTrials;
  }

  gridForm = new ArrayStim({win: psychoJS.window, nElements: ((gridXY + 1) * 2), sizes: [gridSize, 2], xys: gridCoordinates, oris: gridAngles, units: "pix", elementMask: "line", colors: colour});
  fillerForm = new ArrayStim({win: psychoJS.window, nElements: Math.pow(gridXY, 2), sizes: sampleSize, xys: cellCoordinates, units: "pix", elementFill: true, elementMask: "circle", colors: math.multiply(colour,-1)});
  
  meanMatchJitter = math.format(math.mean(matchJitter), {notation: 'fixed', precision: 1});

  instructionClock = new util.Clock();
  instructionText = new visual.TextStim({
    win: psychoJS.window,
    name: 'instructionText',
    text: undefined,
    font: 'Calibri',
    units: undefined, 
    pos: [0, Math.round(gridSize*0.35)], height: letterHeight,  wrapWidth: Math.round(gridSize*1.5), ori: 0,
    color: new util.Color('white'),  opacity: 1,
    depth: -1.0 
  });
  instructionImage = new visual.ImageStim({
    win : psychoJS.window,
    name : 'instructionImage', units : undefined, 
    image : undefined, mask : undefined,
    ori : 0, pos : [0, -Math.round(gridSize*0.35)], size : [Math.round(gridSize*1.25), Math.round(gridSize*0.5)],
    color : new util.Color([1, 1, 1]), opacity : 1,
    flipHoriz : false, flipVert : false,
    texRes : 128, interpolate : true, depth : -2.0 
  });
  instructionKey = new core.Keyboard({psychoJS: psychoJS, clock: new util.Clock(), waitForStart: true});
  
  // Initialize components for Routine "dummy"
  dummyClock = new util.Clock();
  dummyText = new visual.TextStim({
    win: psychoJS.window,
    name: 'dummyText',
    text: 'default text',
    font: 'Calibri',
    units: undefined, 
    pos: [0, 0], height: letterHeight,  wrapWidth: undefined, ori: 0,
    color: new util.Color('white'),  opacity: 1,
    depth: 0.0 
  });
  
  // Initialize components for Routine "sample"
  sampleClock = new util.Clock();
  sampleBackground = new visual.Rect ({
    win: psychoJS.window, name: 'sampleBackground', units : 'norm', 
    width: [2, 2][0], height: [2, 2][1],
    ori: 0, pos: [0, 0],
    lineWidth: 1, lineColor: new util.Color([0, 0, 0]),
    fillColor: new util.Color([0, 0, 0]),
    opacity: 1, depth: 0, interpolate: true,
  });
  
  // Initialize components for Routine "match"
  matchClock = new util.Clock();
  matchBackground = new visual.Rect ({
    win: psychoJS.window, name: 'matchBackground', units : 'norm', 
    width: [2, 2][0], height: [2, 2][1],
    ori: 0, pos: [0, 0],
    lineWidth: 1, lineColor: new util.Color([0, 0, 0]),
    fillColor: new util.Color([0, 0, 0]),
    opacity: 1, depth: 0, interpolate: true,
  });
  
  responseStim = new visual.TextStim({
    win: psychoJS.window,
    name: 'responseStim',
    text: '?',
    font: 'calibri',
    units: 'pix', 
    pos: [0, 0], height: (gridSize * 0.9),  wrapWidth: undefined, ori: 0,
    color: new util.Color('white'),  opacity: 1,
    depth: -2.0 
  });
  matchKey = new core.Keyboard({psychoJS: psychoJS, clock: new util.Clock(), waitForStart: true});
  
  // Initialize components for Routine "end"
  endClock = new util.Clock();
  endText_feedback = new visual.TextStim({
    win: psychoJS.window,
    name: 'endText_feedback',
    text: '',
    font: 'Calibri',
    units: undefined, 
    pos: [0, 150], height: letterHeight,  wrapWidth: 1200, ori: 0,
    color: new util.Color('white'),  opacity: 1,
    depth: 0.0 
  }); 
  endText_farewell = new visual.TextStim({
    win: psychoJS.window,
    name: 'endText_farewell',
    text: '',
    font: 'Calibri',
    units: undefined, 
    pos: [0, -50], height: letterHeight*2,  wrapWidth: 1200, ori: 0,
    color: new util.Color('red'),  opacity: 1,
    depth: 0.0 
  });  
  endKey = new core.Keyboard({psychoJS: psychoJS, clock: new util.Clock(), waitForStart: true});
  
  // Create some handy timers
  globalClock = new util.Clock();  // to track the time since experiment started
  routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine
  
  return Scheduler.Event.NEXT;
}

function loopInstructionLoopBegin(thisScheduler) {
  // set up handler to look after randomisation of conditions etc
  loopInstruction = new TrialHandler({
    psychoJS: psychoJS,
    nReps: nInstruction, method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo, originPath: undefined,
    trialList: undefined,
    seed: undefined, name: 'loopInstruction'
  });
  psychoJS.experiment.addLoop(loopInstruction); // add the loop to the experiment
  let currentLoop = loopInstruction;  // we're now the current loop

  // Schedule all the trials in the trialList:
  for (const thisLoopDummie of loopInstruction) {
    const snapshot = loopInstruction.getSnapshot();
    thisScheduler.add(importConditions(snapshot));
    thisScheduler.add(instructionRoutineBegin(snapshot));
    thisScheduler.add(instructionRoutineEachFrame(snapshot));
    thisScheduler.add(instructionRoutineEnd(snapshot));
    thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
  }

  return Scheduler.Event.NEXT; 
}

function loopInstructionLoopEnd() {
  psychoJS.experiment.removeLoop(loopInstruction);

  return Scheduler.Event.NEXT;
}

function loopDummiesLoopBegin(thisScheduler) {
  // set up handler to look after randomisation of conditions etc
  loopDummies = new TrialHandler({
    psychoJS: psychoJS,
    nReps: nDummies, method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo, originPath: undefined,
    trialList: undefined,
    seed: undefined, name: 'loopDummies'
  });
  psychoJS.experiment.addLoop(loopDummies); // add the loop to the experiment
  let currentLoop = loopDummies;  // we're now the current loop

  // Schedule all the trials in the trialList:
  for (const thisLoopDummie of loopDummies) {
    const snapshot = loopDummies.getSnapshot();
    thisScheduler.add(importConditions(snapshot));
    thisScheduler.add(dummyRoutineBegin(snapshot));
    thisScheduler.add(dummyRoutineEachFrame(snapshot));
    thisScheduler.add(dummyRoutineEnd(snapshot));
    thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
  }

  return Scheduler.Event.NEXT;
}

function loopDummiesLoopEnd() {
  psychoJS.experiment.removeLoop(loopDummies);

  return Scheduler.Event.NEXT;
}

function loopSampleLoopBegin(thisScheduler) {
  // set up handler to look after randomisation of conditions etc
  loopSample = new TrialHandler({
    psychoJS: psychoJS,
    nReps: nSample, method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo, originPath: undefined,
    trialList: undefined,
    seed: undefined, name: 'loopSample'
  });
  psychoJS.experiment.addLoop(loopSample); // add the loop to the experiment
  let currentLoop = loopSample;  // we're now the current loop

  // Schedule all the trials in the trialList:
  for (const thisLoopSample of loopSample) {
    const snapshot = loopSample.getSnapshot();
    thisScheduler.add(importConditions(snapshot));
    thisScheduler.add(sampleRoutineBegin(snapshot));
    thisScheduler.add(sampleRoutineEachFrame(snapshot));
    thisScheduler.add(sampleRoutineEnd(snapshot));
    const loopMatchLoopScheduler = new Scheduler(psychoJS);
    thisScheduler.add(loopMatchLoopBegin, loopMatchLoopScheduler);
    thisScheduler.add(loopMatchLoopScheduler);
    thisScheduler.add(loopMatchLoopEnd);
    thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
  }

  return Scheduler.Event.NEXT;
}

function loopMatchLoopBegin(thisScheduler) {
  // set up handler to look after randomisation of conditions etc
  loopMatch = new TrialHandler({
    psychoJS: psychoJS,
    nReps: nMatch, method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo, originPath: undefined,
    trialList: undefined,
    seed: undefined, name: 'loopMatch'
  });
  psychoJS.experiment.addLoop(loopMatch); // add the loop to the experiment
  let currentLoop = loopMatch;  // we're now the current loop

  // Schedule all the trials in the trialList:
  for (const thisLoopMatch of loopMatch) {
    const snapshot = loopMatch.getSnapshot();
    thisScheduler.add(importConditions(snapshot));
    thisScheduler.add(matchRoutineBegin(snapshot));
    thisScheduler.add(matchRoutineEachFrame(snapshot));
    thisScheduler.add(matchRoutineEnd(snapshot));
    thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
  }

  return Scheduler.Event.NEXT;
}

function loopMatchLoopEnd() {
  psychoJS.experiment.removeLoop(loopMatch);

  return Scheduler.Event.NEXT;
}

function loopSampleLoopEnd() {
  psychoJS.experiment.removeLoop(loopSample);

  return Scheduler.Event.NEXT;
}

function instructionRoutineBegin(trials) {
  return function () {
    //------Prepare to start Routine 'instruction'-------
    t = 0;
    instructionClock.reset(); // clock
    frameN = -1;
    // update component parameters for each repeat
    instructionText.setText(msgParse(_('instruction')[trials.thisN]));
    instructionImage.setImage(psychoJS.serverManager.getResource('flow'.concat(trials.thisN.toString())))
    instructionKey.keys = undefined;
    instructionKey.rt = undefined;
    _instructionKey_allKeys = [];
    // keep track of which components have finished
    instructionComponents = [];
    instructionComponents.push(instructionText);
    instructionComponents.push(instructionImage);
    instructionComponents.push(instructionKey);
    
    for (const thisComponent of instructionComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    
    return Scheduler.Event.NEXT;
  };
}

function instructionRoutineEachFrame(trials) {
  return function () {
    //------Loop for each frame of Routine 'instruction'-------
    let continueRoutine = true; // until we're told otherwise
    // get current time
    t = instructionClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *instructionText* updates
    if (t >= 0.0 && instructionText.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      instructionText.tStart = t;  // (not accounting for frame time here)
      instructionText.frameNStart = frameN;  // exact frame index
      
      instructionText.setAutoDraw(true);
    }

    // *instructionImage* updates
    if (t >= 0.0 && instructionImage.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      instructionImage.tStart = t;  // (not accounting for frame time here)
      instructionImage.frameNStart = frameN;  // exact frame index
      
      instructionImage.setAutoDraw(true);
    }

    // *instructionKey* updates
    if (t >= 0.0 && instructionKey.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      instructionKey.tStart = t;  // (not accounting for frame time here)
      instructionKey.frameNStart = frameN;  // exact frame index
      
      // keyboard checking is just starting
      psychoJS.window.callOnFlip(function() { instructionKey.clock.reset(); });  // t=0 on next screen flip
      psychoJS.window.callOnFlip(function() { instructionKey.start(); }); // start on screen flip
    }

    if (instructionKey.status === PsychoJS.Status.STARTED) {
      let theseKeys = instructionKey.getKeys({keyList: [bYes], waitRelease: false});
      _instructionKey_allKeys = _instructionKey_allKeys.concat(theseKeys);
      if (_instructionKey_allKeys.length > 0) {
        instructionKey.keys = _instructionKey_allKeys[_instructionKey_allKeys.length - 1].name;  // just the last key pressed
        instructionKey.rt = _instructionKey_allKeys[_instructionKey_allKeys.length - 1].rt;
        // a response ends the routine
        continueRoutine = false;
      }
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS(_('terminated'), false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of instructionComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function instructionRoutineEnd(trials) {
  return function () {
    //------Ending Routine 'instruction'-------
    for (const thisComponent of instructionComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    // the Routine "instruction" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    return Scheduler.Event.NEXT;
  };
}

function dummyRoutineBegin(trials) {
  return function () {
    //------Prepare to start Routine 'dummy'-------
    t = 0;
    dummyClock.reset(); // clock
    frameN = -1;
    // update component parameters for each repeat
    dummyText.setText((nDummies - trials.thisN).toString());
    // keep track of which components have finished
    dummyComponents = [];
    dummyComponents.push(dummyText);
    
    for (const thisComponent of dummyComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    
    return Scheduler.Event.NEXT;
  };
}

function dummyRoutineEachFrame(trials) {
  return function () {
    //------Loop for each frame of Routine 'dummy'-------
    let continueRoutine = true; // until we're told otherwise
    // get current time
    t = dummyClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *dummyText* updates
    if (t >= 0.0 && dummyText.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      dummyText.tStart = t;  // (not accounting for frame time here)
      dummyText.frameNStart = frameN;  // exact frame index
      
      dummyText.setAutoDraw(true);
    }

    tRemains = 0.0 + dummyDuration - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
    if (dummyText.status === PsychoJS.Status.STARTED && t >= tRemains) {
      dummyText.setAutoDraw(false);
    }
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS(_('terminated'), false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of dummyComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function dummyRoutineEnd(trials) {
  return function () {
    //------Ending Routine 'dummy'-------
    for (const thisComponent of dummyComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    globalClock.reset();
    
    // the Routine "dummy" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    return Scheduler.Event.NEXT;
  };
}

function sampleRoutineBegin(trials) {
  return function () {
    //------Prepare to start Routine 'sample'-------
    t = 0;
    sampleClock.reset(); // clock
    frameN = -1;
    // update component parameters for each repeat
    thisSample = sampleTrials[trials.thisRepN];
    jitter = thisSample["onsetSample"];
    let sampleCoordinates = math.subset(cellCoordinates,math.index(thisSample["sample"],[0,1]))
    sampleForm = new ArrayStim({win: psychoJS.window, nElements: sampleCoordinates.length, sizes: sampleSize, xys: sampleCoordinates, units: "pix", elementFill: true, elementMask: "circle", colors: colour});
    sampleForm.status = NOT_STARTED;
    fillerForm.status = NOT_STARTED;
    
    // keep track of which components have finished
    sampleComponents = [];
    sampleComponents.push(sampleBackground);
    
    for (const thisComponent of sampleComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    
    return Scheduler.Event.NEXT;
  };
}

function sampleRoutineEachFrame(trials) {
  return function () {
    //------Loop for each frame of Routine 'sample'-------
    let continueRoutine = true; // until we're told otherwise
    // get current time
    t = sampleClock.getTime();
	tGlobal = globalClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *sampleBackground* updates
    if (t >= 0.0 && sampleBackground.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      sampleBackground.tStart = t;  // (not accounting for frame time here)
      sampleBackground.frameNStart = frameN;  // exact frame index
      
      sampleBackground.setAutoDraw(true);
    }

    tRemains = 0.0 + ((sampleTrials[trials.thisRepN]['onsetSample'] + sampleDuration) + sampleTrials[trials.thisRepN]['onsetMatch']) - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
    if (sampleBackground.status === PsychoJS.Status.STARTED && t >= tRemains) {
      sampleBackground.setAutoDraw(false);
    }
    gridForm.setAutoDraw(true);
    if ((sampleForm.status === NOT_STARTED) && (t >= jitter)) {
        sampleForm.tStart = tGlobal;
        sampleForm.setAutoDraw(true);
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": ("Sample - STARTED - " + math.format(thisSample["sample"]))});
    }
    if ((sampleForm.status === PsychoJS.Status.STARTED) && (t >= (jitter + sampleDuration))) {
        sampleForm.setAutoDraw(false);
        sampleForm.tStop = tGlobal;
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": "Sample - STOPPED"});
    }
    if ((fillerForm.status === NOT_STARTED) && (t >= (jitter + sampleDuration))) {
        fillerForm.tStart = tGlobal;
        fillerForm.setAutoDraw(true);
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": "Filler - STARTED"});
    }
    if ((fillerForm.status === PsychoJS.Status.STARTED) && (t >= (jitter + sampleDuration + fillerDuration))) {
        fillerForm.setAutoDraw(false);
        fillerForm.tStop = tGlobal;
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": "Filler - STOPPED"});
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS(_('terminated'), false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of sampleComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function sampleRoutineEnd(trials) {
  return function () {
    //------Ending Routine 'sample'-------
    for (const thisComponent of sampleComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData("sample", thisSample["sample"]);
    psychoJS.experiment.addData("sample_started", sampleForm.tStart);
    psychoJS.experiment.addData("sample_stopped", sampleForm.tStop);
    psychoJS.experiment.addData("filler_started", fillerForm.tStart);
    psychoJS.experiment.addData("filler_stopped", fillerForm.tStop);
    gridForm.setAutoDraw(false);
    
    // the Routine "sample" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    return Scheduler.Event.NEXT;
  };
}

function matchRoutineBegin(trials) {
  return function () {
    //------Prepare to start Routine 'match'-------
    t = 0;
    matchClock.reset(); // clock
    frameN = -1;
    // update component parameters for each repeat
    thisMatch = thisSample["matchTrials"][trials.thisRepN];

    let matchCoordinates = math.subset(cellCoordinates,math.index(thisMatch["match"],[0,1]))
    matchForm = new ArrayStim({win: psychoJS.window, nElements: matchCoordinates.length, sizes: sampleSize, xys: matchCoordinates, units: "pix", elementFill: true, elementMask: "circle", colors: colour});
    matchForm.status === NOT_STARTED;
    
    matchKey.keys = undefined;
    matchKey.rt = undefined;
    _matchKey_allKeys = [];
    // keep track of which components have finished
    matchComponents = [];
    matchComponents.push(matchBackground);
    matchComponents.push(responseStim);
    matchComponents.push(matchKey);
    
    for (const thisComponent of matchComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    
    return Scheduler.Event.NEXT;
  };
}

function matchRoutineEachFrame(trials) {
  return function () {
    //------Loop for each frame of Routine 'match'-------
    let continueRoutine = true; // until we're told otherwise
    // get current time
    t = matchClock.getTime();
	tGlobal = globalClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *matchBackground* updates
    if (t >= 0.0 && matchBackground.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      matchBackground.tStart = t;  // (not accounting for frame time here)
      matchBackground.frameNStart = frameN;  // exact frame index
      
      matchBackground.setAutoDraw(true);
    }

    tRemains = 0.0 + ((sampleDuration + thisSample['matchTrials'][trials.thisRepN]['onsetResponse']) + responseDuration) - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
    if (matchBackground.status === PsychoJS.Status.STARTED && t >= tRemains) {
      matchBackground.setAutoDraw(false);
    }
    gridForm.setAutoDraw(true);
    if ((matchForm.status === NOT_STARTED) && (t >= 0)) {
        matchForm.tStart = tGlobal;
        matchForm.setAutoDraw(true);
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": ("Match - STARTED - " + math.format(thisMatch["match"]))});
    }
    if ((matchForm.status === PsychoJS.Status.STARTED) && (t >= sampleDuration)) {
        matchForm.setAutoDraw(false);
        matchForm.tStop = tGlobal;
        psychoJS.window.logOnFlip({"level": core.Logger.ServerLevel.EXP, "msg": "Match - STOPPED"});
    }
    
    
    // *responseStim* updates
    if (t >= (sampleDuration + thisSample['matchTrials'][trials.thisRepN]['onsetResponse']) && responseStim.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      responseStim.tStart = tGlobal;  // (not accounting for frame time here)
      responseStim.frameNStart = frameN;  // exact frame index
      
      responseStim.setAutoDraw(true);
    }

    tRemains = (sampleDuration + thisSample['matchTrials'][trials.thisRepN]['onsetResponse']) + responseDuration - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
    if (responseStim.status === PsychoJS.Status.STARTED && t >= tRemains) {
      responseStim.setAutoDraw(false);
    }
    
    // *matchKey* updates
    if (t >= (sampleDuration + thisSample['matchTrials'][trials.thisRepN]['onsetResponse']) && matchKey.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      matchKey.tStart = t;  // (not accounting for frame time here)
      matchKey.frameNStart = frameN;  // exact frame index
      
      // keyboard checking is just starting
      psychoJS.window.callOnFlip(function() { matchKey.clock.reset(); });  // t=0 on next screen flip
      psychoJS.window.callOnFlip(function() { matchKey.start(); }); // start on screen flip
      psychoJS.window.callOnFlip(function() { matchKey.clearEvents(); });
    }

    tRemains = (sampleDuration + thisSample['matchTrials'][trials.thisRepN]['onsetResponse']) + responseDuration - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
    if (matchKey.status === PsychoJS.Status.STARTED && t >= tRemains) {
      matchKey.status = PsychoJS.Status.FINISHED;
  }

    if (matchKey.status === PsychoJS.Status.STARTED) {
      let theseKeys = matchKey.getKeys({keyList: [bYes, bNo], waitRelease: false});
      _matchKey_allKeys = _matchKey_allKeys.concat(theseKeys);
      if (_matchKey_allKeys.length > 0) {
        matchKey.keys = _matchKey_allKeys[0].name;  // just the first key pressed
        matchKey.rt = _matchKey_allKeys[0].rt;
      }
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS(_('terminated'), false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of matchComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function matchRoutineEnd(trials) {
  return function () {
	let isMatch
    //------Ending Routine 'match'-------
    for (const thisComponent of matchComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    psychoJS.experiment.addData("match", thisMatch["match"]);
    psychoJS.experiment.addData("match_started", matchForm.tStart);
    psychoJS.experiment.addData("match_stopped", matchForm.tStop);
    psychoJS.experiment.addData("response_started", responseStim.tStart);
    psychoJS.experiment.addData("response_stopped", responseStim.tStop);
    gridForm.setAutoDraw(false);
    
    psychoJS.experiment.addData('matchKey_keys', matchKey.keys);
    if (typeof matchKey.keys !== 'undefined') {  // we had a response
        if ((expInfo["match type"] === "single")) {
            isMatch = isin(thisMatch["match"], thisSample["sample"])[0];
        } else if ((expInfo["match type"] === "multi")) {
            isMatch = math.deepEqual(thisMatch["match"],thisSample["sample"]);
        }
        if ((isMatch && (matchKey.keys === bYes))) {
            psychoJS.experiment.addData("resp_code", "hit");
        } else if (((! isMatch) && (matchKey.keys === bNo))) {
            psychoJS.experiment.addData("resp_code", "cr");
        } else {
            psychoJS.experiment.addData("resp_code", "false");
        }
        psychoJS.experiment.addData('matchKey_rt', matchKey.rt);
    } else {
        psychoJS.experiment.addData("resp_code", "miss");
    }
    
    matchKey.stop();
    // the Routine "match" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    return Scheduler.Event.NEXT;
  };
}

function endRoutineBegin(trials) {
  return function () {
    //------Prepare to start Routine 'end'-------
    t = 0;
    endClock.reset(); // clock
    frameN = -1;
    // update component parameters for each repeat
    endKey.keys = undefined;
    endKey.rt = undefined;
    _endKey_allKeys = [];

    let thisRun = psychoJS.experiment._entries.filter(e => e['run'] == expInfo['run']);
    performance = thisRun.filter(e => e.hasOwnProperty('resp_code')).map(e => e['resp_code']);
    nCorrect = math.sum(performance.map(p => p == 'hit' | p == 'cr'));
    nTotal = performance.length;
    performance = nCorrect/nTotal*100    

    if (!isNaN(performance)) {
      endText_feedback.setText(msgParse(_('feedback')));
      endText_farewell.setText(msgParse(_('farewell')));
    }

    // keep track of which components have finished
    endComponents = [];
    endComponents.push(endText_feedback);
    endComponents.push(endText_farewell);
    endComponents.push(endKey);
    
    for (const thisComponent of endComponents)
      if ('status' in thisComponent)
        thisComponent.status = PsychoJS.Status.NOT_STARTED;
    
    return Scheduler.Event.NEXT;
  };
}

function endRoutineEachFrame(trials) {
  return function () {
    //------Loop for each frame of Routine 'end'-------
    let continueRoutine = true; // until we're told otherwise
    // get current time
    t = endClock.getTime();
    frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame
    
    // *endText* updates
    if (t >= 0.0 && endText_feedback.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      endText_feedback.tStart = t;  // (not accounting for frame time here)
      endText_feedback.frameNStart = frameN;  // exact frame index
      endText_feedback.setAutoDraw(true);

      endText_farewell.tStart = t;  // (not accounting for frame time here)
      endText_farewell.frameNStart = frameN;  // exact frame index
      endText_farewell.setAutoDraw(true);
    }

    
    // *endKey* updates
    if (t >= 0.0 && endKey.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      endKey.tStart = t;  // (not accounting for frame time here)
      endKey.frameNStart = frameN;  // exact frame index
      
      // keyboard checking is just starting
      psychoJS.window.callOnFlip(function() { endKey.clock.reset(); });  // t=0 on next screen flip
      psychoJS.window.callOnFlip(function() { endKey.start(); }); // start on screen flip
    }

    if (endKey.status === PsychoJS.Status.STARTED) {
      let theseKeys = endKey.getKeys({keyList: ['space'], waitRelease: false});
      _endKey_allKeys = _endKey_allKeys.concat(theseKeys);
      if (_endKey_allKeys.length > 0) {
        endKey.keys = _endKey_allKeys[_endKey_allKeys.length - 1].name;  // just the last key pressed
        endKey.rt = _endKey_allKeys[_endKey_allKeys.length - 1].rt;
        // a response ends the routine
        continueRoutine = false;
      }
    }
    
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
      return quitPsychoJS(_('terminated'), false);
    }
    
    // check if the Routine should terminate
    if (!continueRoutine) {  // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT;
    }
    
    continueRoutine = false;  // reverts to True if at least one component still running
    for (const thisComponent of endComponents)
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true;
        break;
      }
    
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT;
    } else {
      return Scheduler.Event.NEXT;
    }
  };
}

function endRoutineEnd(trials) {
  return function () {
    //------Ending Routine 'end'-------
    for (const thisComponent of endComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false);
      }
    }
    // the Routine "end" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset();
    
    return Scheduler.Event.NEXT;
  };
}

function endLoopIteration(thisScheduler, loop) {
  // ------Prepare for next entry------
  return function () {
    if (typeof loop !== 'undefined') {
      // ------Check if user ended loop early------
      if (loop.finished) {
        // Check for and save orphaned data
        if (psychoJS.experiment.isEntryEmpty()) {
          psychoJS.experiment.nextEntry(loop);
        }
      thisScheduler.stop();
      } else {
        const thisTrial = loop.getCurrentTrial();
        if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials) {
          psychoJS.experiment.nextEntry(loop);
        }
      }
    return Scheduler.Event.NEXT;
    }
  };
}

function importConditions(trials) {
  return function () {
    psychoJS.importAttributes(trials.getCurrentTrial());
    return Scheduler.Event.NEXT;
    };
}

function quitPsychoJS(message, isCompleted) {
  // Check for and save orphaned data
  if (psychoJS.experiment.isEntryEmpty()) {
    psychoJS.experiment.nextEntry();
  }
  
  nextRun(psychoJS.scheduler)
  
  if ((psychoJS.scheduler._taskList.length == 0) | (message.includes('Escape')) | psychoJS.gui.dialogComponent.button == 'Cancel') {
    saveData()
    psychoJS.window.close();
    psychoJS.quit({message: message, isCompleted: isCompleted});
    return Scheduler.Event.QUIT;
  } else {
    psychoJS.gui.dialog({
      warning: _('waitfornext'),
      showOK: true
    });
    return Scheduler.Event.NEXT;
  }  
}

function saveData() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'write-data.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if(xhr.status == 200){
          var response = JSON.parse(xhr.responseText);
          if(response.success !== true) {
              if(!window.ignoreSaveErrors) {
                  psychoJS.gui.dialog({
                      warning: response.message,
                      showOK: true
                  });
              }
          }
      }
  };
  
  // format expInfo for database
  var expInfotoDB = {};
  for (let f of Object.keys(psychoJS.experiment.extraInfo)) {
    var newField = Object.keys(en).find(key => en[key] === f);
    if (! newField) { newField = f.replace(/ /g,'_') }
    expInfotoDB[newField] = psychoJS.experiment.extraInfo[f];
  }
  expInfotoDB['run'] = 0

  // select entries [3-4, 6-7, ...]
  var datatoDB = [];
  var addtoDB = false;
  const fieldstoDB = ['sample_started', 'sample_stopped', 'filler_started', 'filler_stopped','match_started','match_stopped','response_started','sample','match','matchKey_keys','matchKey_rt','resp_code'];
  datatoDB.push(expInfotoDB)
    for (let i = 0; i < psychoJS.experiment._trialsData.length; i = i+1) {
      addtoDB = false;
      for (let f of fieldstoDB) {
        if (psychoJS.experiment._trialsData[i][f]) { addtoDB = true }
      }
      if (addtoDB) { datatoDB.push(psychoJS.experiment._trialsData[i]) }
  };

  xhr.send(JSON.stringify(datatoDB));
  console.log('Saving data:');
  console.log(JSON.stringify(datatoDB));
}
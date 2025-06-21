// BasketballTimer.jsx
import { useState, useEffect, useRef } from 'react';

function BasketballTimer() {
  // Game timer state
  const [inputMinutes, setInputMinutes] = useState(10);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [initialTimeMs, setInitialTimeMs] = useState((10 * 60 + 0) * 1000);
  const [timeLeftMs, setTimeLeftMs] = useState(initialTimeMs);
  const [isRunning, setIsRunning] = useState(false);

  // Shot clock state
  const [shotClockMs, setShotClockMs] = useState(24000);

  // Scores
  const [homeScore, setHomeScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);

  // Refs and flags
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const shotEndTimeRef = useRef(null);
  const buzzerSound = useRef(null);
  const shotBuzzerPlayed = useRef(false);
  const containerRef = useRef(null);

  // Load buzzer sound
  useEffect(() => {
    buzzerSound.current = new Audio('/buzzer.mp3');
  }, []);

  // Start both clocks together
  const startClocks = () => {
    // compute aligned full-second start values
    const alignedMain = Math.ceil(initialTimeMs / 1000) * 1000;
    const alignedShot = Math.ceil(shotClockMs / 1000) * 1000;

    // immediately update states so UI shows full second
    setTimeLeftMs(alignedMain);
    setShotClockMs(alignedShot);

    // clear any existing interval
    clearInterval(intervalRef.current);

    // start actual ticking on next tick (ensures state is flushed)
    setTimeout(() => {
      const now = Date.now();
      endTimeRef.current = now + alignedMain;
      shotEndTimeRef.current = now + alignedShot;
      shotBuzzerPlayed.current = false;
      setIsRunning(true);
    }, 0);
  };

  // Timer & shot clock effect
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remainingMain = Math.max(0, endTimeRef.current - now);
      const remainingShot = Math.max(0, shotEndTimeRef.current - now);

      setTimeLeftMs(remainingMain);
      setShotClockMs(remainingShot);

      // Main buzzer
      if (remainingMain <= 0) {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        buzzerSound.current.play();
      }

      // Shot buzzer
      if (remainingShot <= 0 && !shotBuzzerPlayed.current) {
        buzzerSound.current.play();
        shotBuzzerPlayed.current = true;
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Reset both timers
  const handleSetAndReset = () => {
    const totalMs = (inputMinutes * 60 + inputSeconds) * 1000;
    setInitialTimeMs(totalMs);
    setTimeLeftMs(totalMs);
    setShotClockMs(24000);
    setIsRunning(false);
    endTimeRef.current = null;
    shotEndTimeRef.current = null;
    clearInterval(intervalRef.current);
  };

  // Reset shot clock only and keep main timer running
  const resetShotClock = (ms) => {
    const now = Date.now();
    shotEndTimeRef.current = now + ms;
    setShotClockMs(ms);
    shotBuzzerPlayed.current = false;
  };

  // Format functions
  const fmtMain = () => {
    // Above 60s: minutes:seconds with ceiling to hold full second

    if (timeLeftMs === 0) {
      return "0.0";
    }
    if (timeLeftMs >= 60000) {
      const m = Math.floor(timeLeftMs / 60000);
      // use ceil to keep the seconds value until it fully elapses
      const s = String(
        Math.ceil((timeLeftMs % 60000) / 1000)
      ).padStart(2, '0');
      return `${m}:${s}`;
    }
    // Under 60s: show full second using ceil until under 1s, then tenths
    const secs = Math.ceil(timeLeftMs / 1000);
    const remainder = timeLeftMs % 1000;
    if (remainder === 0) {
      return String(secs);
    }
    const tenths = Math.floor(remainder / 100);
    return `${secs}.${tenths}`;
  };

  const fmtShot = () => {
  // 5s or above: show whole second

    if (shotClockMs === 0) {
      return "0.0";
    }
  if (shotClockMs > 4000) {
    return String(Math.ceil(shotClockMs / 1000));
  }
  // below 5s: show seconds.tenths
  const secs = Math.ceil(shotClockMs / 1000);
  const remainder = shotClockMs % 1000;
  if (remainder === 0) {
    return String(secs);
  }
  const tenths = Math.floor(remainder / 100);
  return `${secs}.${tenths}`;
};

  const pauseClocks = () => {
    setIsRunning(false);

    const now = Date.now();
    // Save remaining time
    const remainingMain = Math.max(0, endTimeRef.current - now);
    const remainingShot = Math.max(0, shotEndTimeRef.current - now);

    setTimeLeftMs(remainingMain);
    setShotClockMs(remainingShot);
  };

  // Prevent text selection
  const noSelect = { userSelect: 'none' };

  /* Score click handler
  const handleScoreClick = (e, setScore) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const delta = (e.clientX - left) < width / 2 ? -1 : 1;
    setScore(prev => Math.max(0, prev + delta));
  };*/

    // Fouls and timeouts
  const [homeFouls, setHomeFouls] = useState(0);
  const [visitorFouls, setVisitorFouls] = useState(0);
  const [homeTO, setHomeTO] = useState(3);
  const [visitorTO, setVisitorTO] = useState(3);

  // Quarter and auto-reset fouls
  const [quarter, setQuarter] = useState(1);
  const maxQuarter = 4;
  const maxFouls = 5;
  useEffect(() => {
    // reset fouls at quarter change
    setHomeFouls(0);
    setVisitorFouls(0);
  }, [quarter]);

  //Event Name editable
  const [eventName, setEventName] = useState('Basketball League');

  // Team names editable
  const [homeName, setHomeName] = useState('HOME');
  const [visitorName, setVisitorName] = useState('VISITOR');
  const onBlurName = (setter) => (e) => {
    const text = e.target.innerText.trim() || 'TEAM';
    setter(text);
  };

  // Possession arrow
  const [possession, setPossession] = useState('home');
  const togglePossession = () => setPossession(prev => prev === 'home' ? 'visitor' : 'home');

  // Generic adjust on click
  const handleClickAdjust = (e, setter, max = Infinity) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const delta = (e.clientX - left) < width / 2 ? -1 : 1;
    setter(prev => Math.max(0, Math.min(max, prev + delta)));
  };


  const [customShot24, setCustomShot24] = useState(24);
  const [customShot14, setCustomShot14] = useState(14);

  return (
    <div ref={containerRef} className="bt-container" style={noSelect}>
      <h2 className="bt-header"
        contentEditable
          suppressContentEditableWarning
          onBlur={onBlurName(setEventName)}
      >{eventName}</h2>
      <div className="bt-scoreboard">

        {/* HOME TEAM */}
        <div className="bt-team">
          <div
            className="bt-team-name"
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlurName(setHomeName)}
          >{homeName}</div>
          <h1
            className="bt-score home"
            onClick={e => handleClickAdjust(e, setHomeScore)}
          >{String(homeScore).padStart(2, '0')}</h1>
          <div className="bt-team-stats">
            <p className="bt-sub-label">FOULS</p>
            <p
              className="bt-sub-label-number"
              onClick={e => handleClickAdjust(e, setHomeFouls, maxFouls)}
            >{homeFouls}</p>
            <p className="bt-sub-label">TIMEOUTS</p>
            <p
              className="bt-sub-label-number"
              onClick={e => handleClickAdjust(e, setHomeTO)}
            >{homeTO}</p>
          </div>
        </div>

        <div className="bt-center" style={noSelect}>
          {/* Quarter Selector */}
          <div className="bt-quarter">
            <button
              disabled={quarter <= 1}
              onClick={() => setQuarter(q => Math.max(1, q - 1))}
            >◀</button>
            <span>QUARTER {quarter}</span>
            <button
              disabled={quarter >= maxQuarter}
              onClick={() => setQuarter(q => Math.min(maxQuarter, q + 1))}
            >▶</button>
          </div>
          {/* Possession Arrow */}
          <div className="bt-possession" onClick={togglePossession}>
            {possession === 'home' ? '➡' : '⬅'}
          </div>
          
          <div className="bt-clock-box bt-main-timer">{fmtMain()}</div>
          <div className="bt-clock-box-shotclock bt-shot-clock">{fmtShot()}</div>
          

          <div className="bt-shot-labels">
            <div
              className="bt-clock-box-shotclock-setter bt-shot-label"
              onClick={() => resetShotClock(customShot24 * 1000)}
            >
              {customShot24}
            </div>

            <div
              className="bt-clock-box-shotclock-setter bt-shot-label"
              onClick={() => resetShotClock(customShot14 * 1000)}
            >
              {customShot14}
            </div>
          </div>

          <div className="bt-shot-edit-panel">
            <label>
              Set 24s:
              <input
                type="number"
                value={customShot24}
                onChange={(e) => setCustomShot24(Number(e.target.value))}
                className="bt-shot-input"
              />
            </label>

            <label>
              Set 14s:
              <input
                type="number"
                value={customShot14}
                onChange={(e) => setCustomShot14(Number(e.target.value))}
                className="bt-shot-input"
              />
            </label>
          </div>

        </div>

        {/* VISITOR TEAM */}
        <div className="bt-team">
          <div
            className="bt-team-name"
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlurName(setVisitorName)}
          >{visitorName}</div>
          <h1
            className="bt-score visitor"
            onClick={e => handleClickAdjust(e, setVisitorScore)}
          >{String(visitorScore).padStart(2,'0')}</h1>
          <div className="bt-team-stats">
            <p className="bt-sub-label">FOULS</p>
            <p
              className="bt-sub-label-number"
              onClick={e => handleClickAdjust(e, setVisitorFouls, maxFouls)}
            >{visitorFouls}</p>
            <p className="bt-sub-label">TIMEOUTS</p>
            <p
              className="bt-sub-label-number"
              onClick={e => handleClickAdjust(e, setVisitorTO)}
            >{visitorTO}</p>
          </div>
        </div>

      </div>

      <div className="bt-settings" style={noSelect}>
        <label>
          Minutes:
          <input
            type="number"
            min="0"
            value={inputMinutes}
            onChange={e => setInputMinutes(Number(e.target.value))}
          />
        </label>
        <label>
          Seconds:
          <input
            type="number"
            min="0"
            max="59"
            value={inputSeconds}
            onChange={e => setInputSeconds(Number(e.target.value))}
          />
        </label>
        <button onClick={handleSetAndReset}>Set & Reset</button>
      </div>

      <div className="bt-controls" style={noSelect}>
        <button className="bt-btn-start" onClick={startClocks}>Start</button>

        <button
          className="bt-btn-play"
          onClick={() => {
            const now = Date.now();
            endTimeRef.current = now + timeLeftMs;
            shotEndTimeRef.current = now + shotClockMs;
            setIsRunning(true);
          }}
        >
          ▶
        </button>

        <button className="bt-btn-pause" onClick={pauseClocks}>
          <i className="material-icons">&#xe034;</i>
        </button>

        <button className="bt-btn-reset" onClick={handleSetAndReset}>
          <i className="material-icons">&#xe8b3;</i>
        </button>
      </div>
      <button className="bt-fullscreen" onClick={() => containerRef.current.requestFullscreen()} style={noSelect}>
        Fullscreen
      </button>
    </div>
  );
}

export default BasketballTimer;

// BasketballTimer.jsx
import { useState, useEffect, useRef } from 'react';

const ESP_IP = '192.168.0.107';
 
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

  const [visitorBgColor, setVisitorBgColor] = useState('#ff0000');
  const [homeBgColor, setHomeBgColor] = useState('#0267ffff');
  const colorHomeInputRef = useRef(null);
  const colorVisitorInputRef = useRef(null);

  const handleVisitorColorClick = e => {
    e.stopPropagation();         // so your contentEditable doesn’t steal focus
    colorVisitorInputRef.current.click();
  };

  const handleHomeColorClick = e => {
    e.stopPropagation();         // so your contentEditable doesn’t steal focus
    colorHomeInputRef.current.click();
  };

  const handleVisitorColorChange = e => {
    setVisitorBgColor(e.target.value);
  };
  const handleHomeColorChange = e => {
    setHomeBgColor(e.target.value);
  };

  // Load buzzer sound
  useEffect(() => {
    buzzerSound.current = new Audio('/buzzer.mp3');
  }, []);

  // Initial start: align and begin both clocks
  const startClocks = () => {
    const alignedMain = Math.ceil(initialTimeMs / 1000) * 1000;
    const alignedShot = Math.ceil(shotClockMs / 1000) * 1000;
    setTimeLeftMs(alignedMain);
    setShotClockMs(alignedShot);
    clearInterval(intervalRef.current);
    const now = Date.now();
    endTimeRef.current = now + alignedMain;
    shotEndTimeRef.current = now + alignedShot;
    shotBuzzerPlayed.current = false;
    setIsRunning(true);
  };

  // Resume from paused state without resetting
  const resumeClocks = () => {
    clearInterval(intervalRef.current);
    const now = Date.now();
    endTimeRef.current = now + timeLeftMs;
    shotEndTimeRef.current = now + shotClockMs;
    shotBuzzerPlayed.current = false;
    setIsRunning(true);
  };

  // Pause both clocks and save remaining values
  const pauseClocks = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const now = Date.now();
    setTimeLeftMs(prev => Math.max(0, endTimeRef.current - now));
    setShotClockMs(prev => Math.max(0, shotEndTimeRef.current - now));
  };

  // Toggle: if never started or reset, start; else resume or pause
  const toggleClocks = () => {
    if (isRunning) {
      pauseClocks();
    } else {
      // if endTimeRef null, it's initial start; otherwise resume
      if (endTimeRef.current == null) startClocks();
      else resumeClocks();
    }
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

  // Update ESP with time every 500ms
  // This is to ensure the ESP is always in sync with the displayed time
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      const totalSec = Math.floor(timeLeftMs / 1000);  // ✅ DEFINE totalSec here
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      
      fetch(`http://${ESP_IP}/setTime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `time=${mm}:${ss}`
      }).catch((err) => {
        console.warn("Failed to POST to ESP:", err);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [timeLeftMs, isRunning]);


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

    // 2) reset main timer & shot clock
    setTimeLeftMs(initialTimeMs);
    setShotClockMs(24000);

    if (quarter === 1 || quarter === 3) {
      setHomeTO(3);
      setVisitorTO(3);
    }
  }, [quarter,initialTimeMs]);

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


  const adjust = (delta, setter, max = Infinity) => {
    setter(prev => Math.max(0, Math.min(max, prev + delta)));
  };

  // Generic adjust on click
  const handleClickAdjust = (e, setter, max = Infinity) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const delta = (e.clientX - left) < width / 2 ? -1 : 1;
    setter(prev => Math.max(0, Math.min(max, prev + delta)));
  };

  {/* Handle score for home team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'w') {
        adjust(+1, setHomeScore, 180);
      }
      else if (e.key === 'q') {
        adjust(-1, setHomeScore);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  {/* Handle score for visitor team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'o') {
        adjust(+1, setVisitorScore, 180);
      }
      else if (e.key === 'i') {
        adjust(-1, setVisitorScore);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  {/* Handle fouls for home team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 's') {
        adjust(+1, setHomeFouls, 5);
      }
      else if (e.key === 'a') {
        adjust(-1, setHomeFouls);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  {/* Handle fouls for visitor team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'l') {
        adjust(+1, setVisitorFouls, 5);
      }
      else if (e.key === 'k') {
        adjust(-1, setVisitorFouls);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTOdecrement = () => {
    setVisitorTO(prev => Math.max(0, prev - 1));
  };

  {/* Handle timeouts for home team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'x') {
        adjust(+1, setHomeTO, 3);
      }
      else if (e.key === 'z') {
        adjust(-1, setHomeTO);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  {/* Handle timeouts for visitor team */}
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'n') {
        handleTOdecrement();
      }
      else if (e.key === 'm') {
        adjust(+1, setVisitorTO,3);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onKeyDown = e => {
      switch (e.key) {
        case ';':
          setQuarter(q => Math.max(1, q - 1)); // Decrease quarter
          break;
          
        case "'":
          setQuarter(q => Math.min(maxQuarter, q + 1)); // Increase quarter
          break;

        case ",":
          resetShotClock(customShot24 * 1000); // Reset shot clock to 24s
          break;

        case ".":
          resetShotClock(customShot14 * 1000); // Reset shot clock to 14s
          break;

        case 'Enter':
          toggleClocks();
          break;

        case 'Shift':
          handleSetAndReset();
          break;

        case 'f':
          if (containerRef.current) {
            containerRef.current.requestFullscreen();
          }
          break;

        case 'Control':
         togglePossession();
         {possession === 'home' ? '➡' : '⬅'}
          break;

        default:
          return; // do nothing for other keys
      }
      // prevent default scroll/typing side-effects
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [timeLeftMs, shotClockMs, isRunning, /* plus any handlers you reference */]);

  const [customShot24, setCustomShot24] = useState(24);
  const [customShot14, setCustomShot14] = useState(14);

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div ref={containerRef} className="bt-container" style={noSelect}>
      

      <div className="bt-scoreboard">

        {/* HOME TEAM */}
        <div className="bt-team">
          <div className="bt-team-image">
            <label htmlFor="home-team-image" style={{ cursor: 'pointer' }}>
              <span role="img" aria-label="Attach image">_</span>
            </label>
            <input
              id="home-team-image"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.className = 'bt-team-logo';
                    const container = e.target.parentNode;
                    const oldImg = container.querySelector('.bt-team-logo');
                    if (oldImg) oldImg.remove();
                    container.appendChild(img);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          <input
            ref={colorHomeInputRef}
            type="color"
            value={homeBgColor}
            onChange={handleHomeColorChange}
            style={{ display: 'none' }}
          />

          <div
            className="bt-team-name-home"
            contentEditable
            suppressContentEditableWarning
            onInput={e => {
              const el = e.currentTarget;
              const text = el.textContent || '';
              if (text.length > MAX_LENGTH) {
                // trim to max length
                el.textContent = text.slice(0, MAX_LENGTH);
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }}
            onBlur={onBlurName(setHomeName)}
            style={{ backgroundColor: homeBgColor }}
          >
            <div
              className="bt-change-color" 
              onClick={handleHomeColorClick}
              title="Change background color"
            />
            {homeName}
          </div>

          <div className="bt-team-score">
            <h1
              className="bt-score home"
              onClick={e => handleClickAdjust(e, setHomeScore,180)}
              style={{ color: homeBgColor }}
            >{String(homeScore).padStart(2, '0')}</h1>
          </div>

          <div className="bt-team-stats">
            <div className='bt-team-stats-foul'>
              <p className="bt-sub-label">F</p>
              <p
                  className="bt-sub-label-number"
                  onClick={e => handleClickAdjust(e, setHomeFouls, maxFouls)}
                >{homeFouls}</p>
            </div>
            <div class="divider"></div>
            <div className='bt-team-stats-timeouts'>
              <p className="bt-sub-label-to">TO</p>
              <p
                  className="bt-sub-label-number"
                  onClick={e => handleClickAdjust(e, setHomeTO)}
                >{homeTO}</p>
            </div>
          </div>
        </div>

        <div className="bt-center" >

          {/* Event Name */}
          <div className="bt-event-name">
            <h2 className="bt-header"
              contentEditable
                suppressContentEditableWarning
                onBlur={onBlurName(setEventName)}
            >{eventName}</h2>
          </div>

          {/* Quarter Selector */}
          <div className="bt-quarter-selector">
            <span className="bt-quarter-number">
              {quarter}
              {quarter === 1
                ? 'st'
                : quarter === 2
                ? 'nd'
                : quarter === 3
                ? 'rd'
                : 'th'}
            </span>
            <span className="bt-quarter-label">
              QUARTER
            </span>
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
        </div>

        {/* VISITOR TEAM */}
        <div className="bt-team">

          <div className="bt-team-image">
            <label htmlFor="visitor-team-image" style={{ cursor: 'pointer' }}>
              <span role="img" aria-label="Attach image">_</span>
            </label>
            <input
              id="visitor-team-image"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    img.className = 'bt-team-logo';
                    const container = e.target.parentNode;
                    const oldImg = container.querySelector('.bt-team-logo');
                    if (oldImg) oldImg.remove();
                    container.appendChild(img);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          <input
            ref={colorVisitorInputRef}
            type="color"
            value={visitorBgColor}
            onChange={handleVisitorColorChange}
            style={{ display: 'none' }}
          />

          <div
            className="bt-team-name-visitor"
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlurName(setVisitorName)}
            style={{ backgroundColor: visitorBgColor }}
          >
            <div
              className="bt-change-color"
              onClick={handleVisitorColorClick}
              title="Change background color"
            />
            {visitorName}
          </div>
          
          <div className="bt-team-score">
            <h1
              className="bt-score visitor"
              onClick={e => handleClickAdjust(e, setVisitorScore)}
              style={{ color: visitorBgColor }}
            >{String(visitorScore).padStart(2,'0')}</h1>
          </div>
          
          <div className="bt-team-stats">
            <div className='bt-team-stats-foul'>
              <p className="bt-sub-label">F</p>
              <p
                className="bt-sub-label-number"
                onClick={e => handleClickAdjust(e, setVisitorFouls, maxFouls)}
              >{visitorFouls}</p>
            </div>
            <div class="divider"></div>
            <div className='bt-team-stats-timeouts'>
              <p className="bt-sub-label-to">TO</p>
              <p
                className="bt-sub-label-number"
                onClick={handleTOdecrement}
              >{visitorTO}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="bt-controls" style={noSelect}>
        {/*<button className="bt-btn-start" onClick={startClocks}>Start</button>*/}

        <button
          className="bt-btn-play"
          onClick={
            toggleClocks
          }
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        {/*<button className="bt-btn-pause" onClick={pauseClocks}>
          <i className="material-icons">&#xe034;</i>
        </button>*/}

        <button className="bt-btn-reset" onClick={handleSetAndReset}>
          <i className="material-icons">&#xe8b3;</i>
        </button>
        {/*<button className="bt-fullscreen" onClick={() => containerRef.current.requestFullscreen()} style={noSelect}>
          <i class="material-icons">&#xe5d0;</i>
        </button>*/}

        <div className="bt-settings-wrapper">
          <button className="bt-btn-settings" onClick={() => setShowSettings(!showSettings)}>
            <i className="material-icons">settings</i>
          </button>
          
          {showSettings && (
            <div className="bt-settings-popup">
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
            
            
          )}
        </div>
      </div>
    </div>
  );
  
}

export default BasketballTimer;

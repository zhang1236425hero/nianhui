document.addEventListener('DOMContentLoaded', function () {
    if (!window.gsap || !window.ScrollTrigger) {
        return;
    }

    if (window.SplitText) {
        gsap.registerPlugin(ScrollTrigger, window.SplitText);
    } else {
        gsap.registerPlugin(ScrollTrigger);
    }

    var sections = gsap.utils.toArray('.section');
    if (!sections.length) {
        return;
    }

    function getSectionScrollDistance(section) {
        var custom = parseFloat(section.getAttribute('data-scroll'));
        if (!isNaN(custom) && custom > 0) {
            return custom;
        }
        return Math.max(section.offsetHeight || 0, window.innerHeight);
    }

    var activeSectionLock = null;

    var homeSection = document.querySelector('#home');
    var homeHandLeft = homeSection ? homeSection.querySelector('.home-hand-left') : null;
    var homeHandRight = homeSection ? homeSection.querySelector('.home-hand-right') : null;
    var introSection = document.querySelector('#section1');
    var introVisual = introSection ? introSection.querySelector('.intro-visual') : null;
    var iconSources = [];
    for (var iconIndex = 2; iconIndex <= 27; iconIndex++) {
        var suffix = iconIndex < 10 ? '0' + iconIndex : String(iconIndex);
        iconSources.push('assets/images/icons/tuxing-' + suffix + '.svg');
    }
    var bgSpawnThreshold = 0.06;
    var bgMaxActive = 14;

    function getHomeHandTargets() {
        var targets = [];
        if (homeHandLeft) {
            targets.push(homeHandLeft);
        }
        if (homeHandRight) {
            targets.push(homeHandRight);
        }
        return targets;
    }

    function setHomeHandsInitial() {
        if (homeHandLeft) {
            gsap.set(homeHandLeft, { xPercent: -80, yPercent: -10, scale: 0.92, autoAlpha: 0 });
        }
        if (homeHandRight) {
            gsap.set(homeHandRight, { xPercent: 80, yPercent: 10, scale: 0.92, autoAlpha: 0 });
        }
    }

    function animateHomeHandsIn() {
        var targets = getHomeHandTargets();
        if (!targets.length) {
            return;
        }
        gsap.killTweensOf(targets);
        var timeline = gsap.timeline({ defaults: { duration: 1.2, ease: 'power3.out' } });
        if (homeHandLeft) {
            timeline.to(homeHandLeft, { xPercent: -18, yPercent: 0, scale: 1, autoAlpha: 1 }, 0);
        }
        if (homeHandRight) {
            timeline.to(homeHandRight, { xPercent: 18, yPercent: 0, scale: 1, autoAlpha: 1 }, 0.06);
        }
    }

    function animateHomeHandsOut() {
        var targets = getHomeHandTargets();
        if (!targets.length) {
            return;
        }
        gsap.killTweensOf(targets);
        var timeline = gsap.timeline({ defaults: { duration: 0.9, ease: 'power3.in' } });
        if (homeHandLeft) {
            timeline.to(homeHandLeft, { xPercent: -80, yPercent: -10, scale: 0.92, autoAlpha: 0 }, 0);
        }
        if (homeHandRight) {
            timeline.to(homeHandRight, { xPercent: 80, yPercent: 10, scale: 0.92, autoAlpha: 0 }, 0);
        }
    }

    function ensureBackgroundLayer(section) {
        if (!section) {
            return null;
        }
        var layer = section.querySelector('.bg-elements');
        if (layer) {
            return layer;
        }
        layer = document.createElement('div');
        layer.className = 'bg-elements';
        var sequenceLayer = section.querySelector('.reservation-sequence');
        var fpBg = section.querySelector('.fp-bg');
        if (sequenceLayer && sequenceLayer.parentNode) {
            sequenceLayer.parentNode.insertBefore(layer, sequenceLayer.nextSibling);
        } else if (fpBg && fpBg.parentNode) {
            fpBg.parentNode.insertBefore(layer, fpBg.nextSibling);
        } else {
            section.insertBefore(layer, section.firstChild);
        }
        return layer;
    }

    function getRandomIconSource() {
        if (!iconSources.length) {
            return '';
        }
        return iconSources[Math.floor(Math.random() * iconSources.length)];
    }

    function spawnBackgroundElement(layer) {
        if (!layer) {
            return;
        }
        var source = getRandomIconSource();
        if (!source) {
            return;
        }
        if (layer.childElementCount >= bgMaxActive) {
            layer.removeChild(layer.firstElementChild);
        }
        var element = document.createElement('img');
        element.className = 'bg-element';
        element.src = source;
        element.alt = '';
        var size = gsap.utils.random(18, 60) * 2;
        element.style.width = size + 'px';
        element.style.left = gsap.utils.random(6, 94) + '%';
        element.style.top = gsap.utils.random(6, 94) + '%';
        layer.appendChild(element);

        var driftX = gsap.utils.random(-40, 40);
        var driftY = gsap.utils.random(-80, -30);
        var rotation = gsap.utils.random(-24, 24);
        var endRotation = rotation + gsap.utils.random(-18, 18);
        var duration = gsap.utils.random(2.6, 3.8);
        var startScale = gsap.utils.random(0.6, 1);

        gsap.set(element, { autoAlpha: 0, scale: startScale, rotation: rotation });
        gsap.timeline({
            onComplete: function () {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }
        }).to(element, {
            autoAlpha: 0.7,
            duration: 0.35,
            ease: 'power2.out'
        }).to(element, {
            x: driftX,
            y: driftY,
            rotation: endRotation,
            autoAlpha: 0,
            duration: duration,
            ease: 'sine.out'
        }, 0.1);
    }

    function setupBackgroundElements(section) {
        var layer = ensureBackgroundLayer(section);
        if (!layer) {
            return;
        }
        var lastProgress = 0;
        var progressAccumulator = 0;

        ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: function () {
                return '+=' + getSectionScrollDistance(section);
            },
            onEnter: function () {
                spawnBackgroundElement(layer);
                spawnBackgroundElement(layer);
            },
            onEnterBack: function () {
                spawnBackgroundElement(layer);
            },
            onUpdate: function (self) {
                var delta = Math.abs(self.progress - lastProgress);
                lastProgress = self.progress;
                if (!delta) {
                    return;
                }
                progressAccumulator += delta;
                if (progressAccumulator < bgSpawnThreshold) {
                    return;
                }
                var count = Math.min(3, Math.floor(progressAccumulator / bgSpawnThreshold));
                progressAccumulator = progressAccumulator % bgSpawnThreshold;
                for (var i = 0; i < count; i++) {
                    spawnBackgroundElement(layer);
                }
            }
        });
    }

    function prepareIntroVisual() {
        if (!introVisual) {
            return;
        }
        gsap.set(introVisual, { autoAlpha: 0, x: 40, y: 20, scale: 0.96, transformOrigin: '50% 50%' });
    }

    function animateIntroVisualIn() {
        if (!introVisual) {
            return;
        }
        gsap.killTweensOf(introVisual);
        gsap.set(introVisual, { autoAlpha: 0, x: 40, y: 20, scale: 0.96 });
        gsap.to(introVisual, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: 'power3.out'
        });
    }

    function setActiveSection(section, isActive) {
        if (!section) {
            return;
        }
        if (activeSectionLock && section !== activeSectionLock && isActive) {
            return;
        }
        section.style.zIndex = isActive ? 5 : 1;
        if (isActive) {
            section.setAttribute('data-active', 'true');
        } else {
            section.removeAttribute('data-active');
        }
    }

    function lockActiveSection(section) {
        if (!section) {
            return;
        }
        activeSectionLock = section;
        section.style.zIndex = 10;
        section.setAttribute('data-active', 'true');
    }

    function unlockActiveSection(section) {
        if (activeSectionLock === section) {
            activeSectionLock = null;
        }
    }

    var venueSection = document.querySelector('#sectionSlides');
    var venueGalleryStrip = venueSection ? venueSection.querySelector('.horiz-gallery-strip') : null;
    var venueGalleryViewport = venueSection ? venueSection.querySelector('.venue-gallery') : null;
    var venueGalleryTween = null;
    var venueGalleryScrollLength = 0;

    function updateVenueGalleryMetrics() {
        if (!venueSection || !venueGalleryStrip || !venueGalleryViewport) {
            return;
        }
        var stripWidth = venueGalleryStrip.scrollWidth;
        var viewportWidth = venueGalleryViewport.clientWidth || venueGalleryViewport.getBoundingClientRect().width || window.innerWidth;
        venueGalleryScrollLength = Math.max(0, stripWidth - viewportWidth);
        venueSection.setAttribute('data-scroll', Math.max(venueGalleryScrollLength, window.innerHeight));
    }

    function resizeSequenceCanvas(canvas, section) {
        if (!canvas || !section) {
            return;
        }
        var ratio = window.devicePixelRatio || 1;
        var width = section.clientWidth || window.innerWidth;
        var height = section.clientHeight || window.innerHeight;
        var nextWidth = Math.round(width * ratio);
        var nextHeight = Math.round(height * ratio);
        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
            canvas.width = nextWidth;
            canvas.height = nextHeight;
        }
    }

    function getSequenceFrameCount(element, fallback) {
        if (!element) {
            return fallback;
        }
        var raw = element.getAttribute('data-sequence-frames');
        var count = parseInt(raw, 10);
        if (!isNaN(count) && count > 1) {
            return count;
        }
        return fallback;
    }

    function resetSequenceToStart(sequenceTween) {
        if (!sequenceTween || !sequenceTween.sequencePlayhead || !sequenceTween.sequenceRender) {
            return;
        }
        sequenceTween.sequencePlayhead.frame = 0;
        sequenceTween.sequenceRender();
    }

    var reservationSection = document.querySelector('#section4');
    var reservationCanvas = reservationSection ? reservationSection.querySelector('#reservation-sequence') : null;
    var reservationSequenceTween = null;
    var reservationSequenceConfig = null;
    var updateReservationSequenceMetrics = null;
    if (reservationCanvas) {
        var reservationSequenceFrameCount = getSequenceFrameCount(reservationSection, 20);
        var reservationSequenceUrls = new Array(reservationSequenceFrameCount).fill().map(function (unused, index) {
            var frameIndex = index + 1;
            var fileName = 'dh (' + frameIndex + ').JPG';
            return 'assets/images/donghua/' + encodeURIComponent(fileName);
        });
        var reservationSequenceTrigger = reservationSection || reservationCanvas;

        function getReservationScrollDistance() {
            return Math.max(window.innerHeight * 2.5, reservationSequenceFrameCount * 20);
        }

        updateReservationSequenceMetrics = function () {
            if (!reservationSection) {
                return;
            }
            resizeSequenceCanvas(reservationCanvas, reservationSection);
            reservationSection.setAttribute('data-scroll', getReservationScrollDistance());
        };

        updateReservationSequenceMetrics();

        reservationSequenceConfig = {
            urls: reservationSequenceUrls,
            canvas: reservationCanvas,
            clear: true,
            fit: 'cover',
            scrollTrigger: {
                trigger: reservationSequenceTrigger,
                start: 'top top',
                end: function () {
                    return '+=' + getReservationScrollDistance();
                },
                scrub: true,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onEnter: function () {
                    lockActiveSection(reservationSequenceTrigger);
                    resetSequenceToStart(reservationSequenceTween);
                    if (reservationSection) {
                        animateSectionTextIn(reservationSection, getTextPresetForSection(reservationSection));
                        animateSplitTextInSection(reservationSection);
                    }
                },
                onEnterBack: function () {
                    lockActiveSection(reservationSequenceTrigger);
                    if (reservationSection) {
                        animateSectionTextIn(reservationSection, getTextPresetForSection(reservationSection));
                        animateSplitTextInSection(reservationSection);
                    }
                },
                onLeave: function () {
                    unlockActiveSection(reservationSequenceTrigger);
                    setActiveSection(reservationSequenceTrigger, false);
                },
                onLeaveBack: function () {
                    unlockActiveSection(reservationSequenceTrigger);
                    setActiveSection(reservationSequenceTrigger, false);
                }
            }
        };
    }

    var giftSection = document.querySelector('#section5');

    var timelineSection = document.querySelector('#section2');
    var timelineCards = timelineSection ? gsap.utils.toArray(timelineSection.querySelectorAll('.timeline-card')) : [];
    var timelineCardsTween = null;
    var timelineLayout = null;
    var timelineCardRotationPreset = [-6, 2, -2, 4];
    var timelineCardRotateYPreset = [10, -8, 8, -10];
    var timelineCardScalePreset = [0.96, 1, 0.98, 1.02];

    function clampValue(value, min, max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    function getTimelineLayout() {
        if (!timelineLayout) {
            timelineLayout = computeTimelineLayout();
        }
        return timelineLayout;
    }

    function getTimelineSectionMetrics() {
        if (!timelineSection) {
            return { width: window.innerWidth, height: window.innerHeight };
        }
        var rect = timelineSection.getBoundingClientRect();
        var width = timelineSection.clientWidth || rect.width || window.innerWidth;
        var height = timelineSection.clientHeight || rect.height || window.innerHeight;
        return { width: width, height: height };
    }

    function getTimelineCardMetrics(card) {
        if (!card) {
            return { width: 320, height: 360 };
        }
        var width = card.offsetWidth;
        var height = card.offsetHeight;
        if (!width || !height) {
            var rect = card.getBoundingClientRect();
            width = width || rect.width || 320;
            height = height || rect.height || 360;
        }
        return { width: width, height: height };
    }

    function computeTimelineLayout() {
        if (!timelineSection || !timelineCards || !timelineCards.length) {
            return null;
        }
        var sectionMetrics = getTimelineSectionMetrics();
        var sectionWidth = sectionMetrics.width;
        var sectionHeight = sectionMetrics.height;
        var isNarrow = sectionWidth < 900;
        var maxVisibleSlots = isNarrow ? 2 : 4;
        var visibleSlots = Math.min(maxVisibleSlots, timelineCards.length);
        var slotX = isNarrow ? [0.34, 0.72] : [0.2, 0.46, 0.64, 0.82];
        var slotY = isNarrow ? [0.6, 0.72] : [0.68, 0.5, 0.56, 0.62];

        var firstCardMetrics = getTimelineCardMetrics(timelineCards[0]);
        var cardWidth = firstCardMetrics.width;
        var cardHeight = firstCardMetrics.height;

        var safeX = Math.max(14, sectionWidth * (isNarrow ? 0.04 : 0.03));
        var safeTop = Math.max(44, sectionHeight * (isNarrow ? 0.12 : 0.1));
        var safeBottom = Math.max(32, sectionHeight * 0.07);

        var minCenterX = safeX + cardWidth / 2;
        var maxCenterX = sectionWidth - safeX - cardWidth / 2;
        var slotCentersX = slotX.slice(0, visibleSlots).map(function (fraction) {
            return clampValue(sectionWidth * fraction, minCenterX, maxCenterX);
        });

        var spacing = Math.max(cardWidth * (isNarrow ? 0.95 : 0.86), 260);
        var travelX = Math.max(0, (timelineCards.length - visibleSlots) * spacing);
        var scrollDistance = Math.max(sectionHeight * 2.2, travelX * 1.25);

        return {
            sectionWidth: sectionWidth,
            sectionHeight: sectionHeight,
            isNarrow: isNarrow,
            visibleSlots: visibleSlots,
            slotCentersX: slotCentersX,
            slotY: slotY,
            spacing: spacing,
            travelX: travelX,
            scrollDistance: scrollDistance,
            safeTop: safeTop,
            safeBottom: safeBottom,
            safeX: safeX
        };
    }

    function applyTimelineCardLayout() {
        if (!timelineCards || !timelineCards.length) {
            return;
        }
        var layout = getTimelineLayout();
        if (!layout) {
            return;
        }

        var sectionHeight = layout.sectionHeight;
        var visibleSlots = layout.visibleSlots;
        var slotCentersX = layout.slotCentersX;
        var slotY = layout.slotY;
        var spacing = layout.spacing;
        var safeTop = layout.safeTop;
        var safeBottom = layout.safeBottom;

        timelineCards.forEach(function (card, index) {
            var cardMetrics = getTimelineCardMetrics(card);
            var cardWidth = cardMetrics.width;
            var cardHeight = cardMetrics.height;

            var slotIndex = index < visibleSlots ? index : Math.max(0, visibleSlots - 1);
            var centerX = slotCentersX[slotIndex] + Math.max(0, index - (visibleSlots - 1)) * spacing;
            var centerY = sectionHeight * slotY[index % slotY.length];

            var rotation = timelineCardRotationPreset[index % timelineCardRotationPreset.length];
            var rotateY = timelineCardRotateYPreset[index % timelineCardRotateYPreset.length];
            var scale = timelineCardScalePreset[index % timelineCardScalePreset.length];

            var effectiveHeight = cardHeight * Math.max(1, scale);
            var minCenterY = safeTop + effectiveHeight / 2;
            var maxCenterY = sectionHeight - safeBottom - effectiveHeight / 2;
            centerY = clampValue(centerY, minCenterY, maxCenterY);

            var x = centerX - cardWidth / 2;
            var y = centerY - cardHeight / 2;

            card.setAttribute('data-tl-x', String(x));
            card.setAttribute('data-tl-y', String(y));
            card.setAttribute('data-tl-rotation', String(rotation));
            card.setAttribute('data-tl-rotatey', String(rotateY));
            card.setAttribute('data-tl-scale', String(scale));

            gsap.set(card, {
                x: x,
                y: y,
                rotation: rotation,
                rotateY: rotateY,
                scale: scale,
                transformOrigin: '50% 50%',
                force3D: true,
                autoAlpha: 1
            });
        });
    }

    function getTimelineTravelX() {
        var layout = getTimelineLayout();
        return layout ? layout.travelX : 0;
    }

    function updateTimelineMetrics() {
        if (!timelineSection || !timelineCards || !timelineCards.length) {
            return;
        }
        timelineLayout = computeTimelineLayout();
        if (!timelineLayout) {
            return;
        }
        timelineSection.setAttribute('data-scroll', timelineLayout.scrollDistance);
        applyTimelineCardLayout();
    }

    function setupTimelineCards() {
        if (!timelineSection || !timelineCards || !timelineCards.length) {
            return;
        }
        updateTimelineMetrics();

        if (timelineCardsTween) {
            if (timelineCardsTween.scrollTrigger) {
                timelineCardsTween.scrollTrigger.kill();
            }
            timelineCardsTween.kill();
            timelineCardsTween = null;
        }

        timelineCardsTween = gsap.timeline({
            scrollTrigger: {
                trigger: timelineSection,
                start: 'top top',
                end: function () {
                    return '+=' + getSectionScrollDistance(timelineSection);
                },
                scrub: 0.85,
                invalidateOnRefresh: true,
                onRefreshInit: function () {
                    updateTimelineMetrics();
                }
            }
        });

        timelineCardsTween.to(timelineCards, {
            x: function (index, target) {
                var baseX = parseFloat(target.getAttribute('data-tl-x') || '0');
                return baseX - getTimelineTravelX();
            },
            ease: 'none'
        }, 0);
        timelineCardsTween.to(timelineCards, {
            y: function (index, target) {
                var layout = getTimelineLayout();
                var baseY = parseFloat(target.getAttribute('data-tl-y') || '0');
                if (!layout) {
                    return baseY;
                }
                var drift = index % 2 ? 28 : -18;
                var metrics = getTimelineCardMetrics(target);
                var baseScale = parseFloat(target.getAttribute('data-tl-scale') || '1');
                var effectiveHalf = metrics.height * Math.max(1, baseScale) / 2;
                var minCenterY = layout.safeTop + effectiveHalf;
                var maxCenterY = layout.sectionHeight - layout.safeBottom - effectiveHalf;
                var nextCenterY = clampValue(baseY + metrics.height / 2 + drift, minCenterY, maxCenterY);
                return nextCenterY - metrics.height / 2;
            },
            rotation: function (index, target) {
                var baseRotation = parseFloat(target.getAttribute('data-tl-rotation') || '0');
                return baseRotation + (index % 2 ? -3 : 3);
            },
            rotateY: function (index, target) {
                var baseRotateY = parseFloat(target.getAttribute('data-tl-rotatey') || '0');
                return baseRotateY * -0.55;
            },
            scale: function (index, target) {
                var baseScale = parseFloat(target.getAttribute('data-tl-scale') || '1');
                return baseScale * (index === timelineCards.length - 1 ? 1.01 : 0.99);
            },
            ease: 'none'
        }, 0);
    }

    updateVenueGalleryMetrics();
    updateTimelineMetrics();
    setHomeHandsInitial();
    if (updateReservationSequenceMetrics) {
        updateReservationSequenceMetrics();
    }
    prepareIntroVisual();

    var giftSequenceCanvas = document.querySelector('#gift-image-sequence');
    var giftSequenceSection = giftSection;
    if (!giftSequenceSection && giftSequenceCanvas) {
        giftSequenceSection = giftSequenceCanvas.closest('.section');
    }
    var giftSequenceTween = null;
    var giftSequenceConfig = null;
    var updateGiftSequenceMetrics = null;
    if (giftSequenceCanvas) {
        var giftSequenceFrameCount = 41;
        var giftSequenceUrls = new Array(giftSequenceFrameCount).fill().map(function (unused, index) {
            if (index === 0) {
                return 'assets/images/zhanshi/zhanshi1.png';
            }
            var fileName = 'zhanshi (' + (index + 1) + ').png';
            return 'assets/images/zhanshi/' + encodeURIComponent(fileName);
        });
        var giftSequenceTrigger = giftSequenceSection || giftSequenceCanvas;

        function getGiftScrollDistance() {
            return Math.max(window.innerHeight * 2.2, giftSequenceFrameCount * 25);
        }

        updateGiftSequenceMetrics = function () {
            if (!giftSequenceSection) {
                return;
            }
            giftSequenceSection.setAttribute('data-scroll', getGiftScrollDistance());
        };

        updateGiftSequenceMetrics();

        giftSequenceConfig = {
            urls: giftSequenceUrls,
            canvas: giftSequenceCanvas,
            clear: true,
            scrollTrigger: {
                trigger: giftSequenceTrigger,
                start: 'top top',
                end: function () {
                    return '+=' + getGiftScrollDistance();
                },
                scrub: true,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onEnter: function () {
                    lockActiveSection(giftSequenceTrigger);
                    if (giftSequenceSection) {
                        animateSectionTextIn(giftSequenceSection, getTextPresetForSection(giftSequenceSection));
                        animateSplitTextInSection(giftSequenceSection);
                    }
                },
                onEnterBack: function () {
                    lockActiveSection(giftSequenceTrigger);
                    if (giftSequenceSection) {
                        animateSectionTextIn(giftSequenceSection, getTextPresetForSection(giftSequenceSection));
                        animateSplitTextInSection(giftSequenceSection);
                    }
                },
                onLeave: function () {
                    unlockActiveSection(giftSequenceTrigger);
                    setActiveSection(giftSequenceTrigger, false);
                },
                onLeaveBack: function () {
                    unlockActiveSection(giftSequenceTrigger);
                    setActiveSection(giftSequenceTrigger, false);
                }
            }
        };
    }

    var sectionTextCache = new WeakMap();
    var textSelector = 'h1, h2, h3, h4, h5, h6, p, li';
    var textAnimationPresets = [
        { from: { opacity: 0, y: 32 }, to: { opacity: 1, y: 0 }, ease: 'power2.out' },
        { from: { opacity: 0, y: -32 }, to: { opacity: 1, y: 0 }, ease: 'power2.out', staggerFrom: 'end' },
        { from: { opacity: 0, x: -40 }, to: { opacity: 1, x: 0 }, ease: 'power3.out' },
        { from: { opacity: 0, x: 40 }, to: { opacity: 1, x: 0 }, ease: 'power3.out', staggerFrom: 'end' },
        { from: { opacity: 0, scale: 0.9 }, to: { opacity: 1, scale: 1 }, ease: 'back.out(1.4)' },
        { from: { opacity: 0, rotation: -6, y: 18 }, to: { opacity: 1, rotation: 0, y: 0 }, ease: 'power2.out' }
    ];
    var sectionTextPresetMap = new WeakMap();
    var splitTextInstances = new WeakMap();
    var splitTextSelector = '[data-split]';
    var splitTextAvailable = typeof window.SplitText !== 'undefined';
    var splitTextElements = [];
    var splitTextCjkRegex = /[\u4e00-\u9fff]/;
    var splitTextPunctuation = '，。！？；：、,.!?;:…';
    var splitTextWordDelimiter = null;

    function getTextPresetByIndex(index) {
        return textAnimationPresets[index % textAnimationPresets.length];
    }

    function getTextPresetForSection(section) {
        return sectionTextPresetMap.get(section) || textAnimationPresets[0];
    }

    function getSplitWordDelimiter() {
        if (splitTextWordDelimiter !== null) {
            return splitTextWordDelimiter;
        }
        try {
            splitTextWordDelimiter = new RegExp('(?<=[' + splitTextPunctuation + '])');
        } catch (error) {
            splitTextWordDelimiter = null;
        }
        return splitTextWordDelimiter;
    }

    function shouldUseCjkWordSplit(textValue) {
        return splitTextCjkRegex.test(textValue || '');
    }

    function getSplitConfig(element) {
        var config = {
            type: 'chars,words,lines',
            wordsClass: 'split-word',
            charsClass: 'split-char',
            linesClass: 'split-line',
            tag: 'span'
        };
        if (element) {
            var textValue = element.textContent || '';
            if (shouldUseCjkWordSplit(textValue)) {
                var delimiter = getSplitWordDelimiter();
                if (delimiter) {
                    config.wordDelimiter = delimiter;
                }
            }
        }
        return config;
    }

    function getSplitMode(element) {
        if (!element) {
            return 'words';
        }
        var mode = (element.getAttribute('data-split') || 'words').toLowerCase();
        if (mode === 'chars' || mode === 'lines' || mode === 'words') {
            return mode;
        }
        return 'words';
    }

    function getSplitTargets(split, mode) {
        if (!split) {
            return [];
        }
        if (mode === 'chars') {
            return split.chars || [];
        }
        if (mode === 'lines') {
            return split.lines || [];
        }
        return split.words || [];
    }

    function setSplitTargetsInitialState(element, split) {
        if (!element || !split) {
            return;
        }
        var mode = getSplitMode(element);
        var targets = getSplitTargets(split, mode);
        if (!targets.length) {
            return;
        }
        var section = element.closest('.section');
        var isActive = !!(section && section.getAttribute('data-active') === 'true');
        gsap.set(targets, { autoAlpha: isActive ? 1 : 0 });
    }

    function getSectionTextTargets(section) {
        if (!section) {
            return [];
        }
        if (sectionTextCache.has(section)) {
            return sectionTextCache.get(section);
        }
        var targets = gsap.utils.toArray(section.querySelectorAll(textSelector));
        targets = targets.filter(function (target) {
            if (target.hasAttribute('data-split')) {
                return false;
            }
            if (target.closest && target.closest('.no-text-anim')) {
                return false;
            }
            return true;
        });
        sectionTextCache.set(section, targets);
        return targets;
    }

    function prepareSectionText(section, sectionIndex) {
        var preset = getTextPresetByIndex(sectionIndex || 0);
        sectionTextPresetMap.set(section, preset);
        var targets = getSectionTextTargets(section);
        if (targets.length) {
            gsap.set(targets, preset.from);
        }
        return preset;
    }

    function animateSectionTextIn(section, preset) {
        var targets = getSectionTextTargets(section);
        if (!targets.length) {
            return;
        }
        var resolvedPreset = preset || textAnimationPresets[0];
        var toVars = Object.assign({}, resolvedPreset.to);
        gsap.killTweensOf(targets);
        gsap.set(targets, resolvedPreset.from);
        toVars.duration = resolvedPreset.duration || 0.9;
        toVars.ease = resolvedPreset.ease || 'power2.out';
        toVars.stagger = { each: resolvedPreset.stagger || 0.08, from: resolvedPreset.staggerFrom || 'start' };
        toVars.overwrite = 'auto';
        gsap.to(targets, toVars);
    }

    function createSplitInstance(element) {
        if (!splitTextAvailable || !element) {
            return null;
        }
        var existing = splitTextInstances.get(element);
        if (existing) {
            existing.revert();
        }
        var instance = new window.SplitText(element, getSplitConfig(element));
        splitTextInstances.set(element, instance);
        setSplitTargetsInitialState(element, instance);
        return instance;
    }

    function getSplitInstance(element) {
        if (!splitTextAvailable || !element) {
            return null;
        }
        var existing = splitTextInstances.get(element);
        if (existing && existing.isSplit) {
            return existing;
        }
        return createSplitInstance(element);
    }

    function refreshSplitInstances() {
        if (!splitTextAvailable) {
            return;
        }
        splitTextElements = gsap.utils.toArray(document.querySelectorAll(splitTextSelector));
        splitTextElements.forEach(function (element) {
            createSplitInstance(element);
        });
    }

    function playSplitWords(element) {
        var split = getSplitInstance(element);
        if (!split || !split.words || !split.words.length) {
            return null;
        }
        gsap.killTweensOf(split.words);
        gsap.set(split.words, { autoAlpha: 1, x: 0, y: 0, rotation: 0, rotationX: 0 });
        return gsap.from(split.words, {
            y: -100,
            opacity: 0,
            rotation: 'random(-80, 80)',
            duration: 0.7,
            ease: 'back',
            stagger: 0.15
        });
    }

    function playSplitChars(element) {
        var split = getSplitInstance(element);
        if (!split || !split.chars || !split.chars.length) {
            return null;
        }
        gsap.killTweensOf(split.chars);
        gsap.set(split.chars, { autoAlpha: 1, x: 0, y: 0, rotation: 0, rotationX: 0 });
        return gsap.from(split.chars, {
            x: 80,
            opacity: 0,
            duration: 0.6,
            ease: 'power4.out',
            stagger: 0.03
        });
    }

    function playSplitLines(element) {
        var split = getSplitInstance(element);
        if (!split || !split.lines || !split.lines.length) {
            return null;
        }
        gsap.killTweensOf(split.lines);
        gsap.set(split.lines, { autoAlpha: 1, x: 0, y: 0, rotation: 0, rotationX: 0 });
        return gsap.from(split.lines, {
            rotationX: -80,
            transformOrigin: '50% 50% -80px',
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.2
        });
    }

    function animateSplitTextInSection(section) {
        if (!section) {
            return;
        }
        var splitTargets = gsap.utils.toArray(section.querySelectorAll(splitTextSelector));
        if (!splitTargets.length) {
            return;
        }
        splitTargets.forEach(function (target) {
            var mode = (target.getAttribute('data-split') || 'words').toLowerCase();
            if (mode === 'chars') {
                playSplitChars(target);
            } else if (mode === 'lines') {
                playSplitLines(target);
            } else {
                playSplitWords(target);
            }
        });
    }

    function createPinnedSectionTrigger(section) {
        var preset = getTextPresetForSection(section);
        ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: function () {
                return '+=' + getSectionScrollDistance(section);
            },
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: function () {
                setActiveSection(section, true);
                animateSectionTextIn(section, preset);
                animateSplitTextInSection(section);
                if (section === homeSection) {
                    animateHomeHandsIn();
                }
                if (section === introSection) {
                    animateIntroVisualIn();
                }
            },
            onEnterBack: function () {
                setActiveSection(section, true);
                animateSectionTextIn(section, preset);
                animateSplitTextInSection(section);
                if (section === homeSection) {
                    animateHomeHandsIn();
                }
                if (section === introSection) {
                    animateIntroVisualIn();
                }
            },
            onLeave: function () {
                setActiveSection(section, false);
                if (section === homeSection) {
                    animateHomeHandsOut();
                }
            },
            onLeaveBack: function () {
                setActiveSection(section, false);
                if (section === homeSection) {
                    animateHomeHandsOut();
                }
            }
        });
    }

    sections.forEach(function (section, index) {
        prepareSectionText(section, index);
    });

    refreshSplitInstances();

    window.splitTextAnimations = {
        words: playSplitWords,
        chars: playSplitChars,
        lines: playSplitLines
    };

    var giftSequenceAttempted = false;
    var reservationSequenceAttempted = false;
    sections.forEach(function (section) {
        setupBackgroundElements(section);
        if (reservationSequenceConfig && section === reservationSection && !reservationSequenceAttempted) {
            reservationSequenceAttempted = true;
            reservationSequenceTween = giftImageSequence(reservationSequenceConfig);
            if (reservationSequenceTween) {
                return;
            }
        }
        if (giftSequenceConfig && section === giftSequenceSection && !giftSequenceAttempted) {
            giftSequenceAttempted = true;
            giftSequenceTween = giftImageSequence(giftSequenceConfig);
            if (giftSequenceTween) {
                return;
            }
        }
        createPinnedSectionTrigger(section);
    });
    if (reservationSequenceConfig && !reservationSequenceAttempted) {
        reservationSequenceTween = giftImageSequence(reservationSequenceConfig);
    }
    if (giftSequenceConfig && !giftSequenceAttempted) {
        giftSequenceTween = giftImageSequence(giftSequenceConfig);
    }

    function setupVenueGallery() {
        if (!venueSection || !venueGalleryStrip) {
            return;
        }
        updateVenueGalleryMetrics();
        if (venueGalleryTween) {
            if (venueGalleryTween.scrollTrigger) {
                venueGalleryTween.scrollTrigger.kill();
            }
            venueGalleryTween.kill();
        }
        venueGalleryTween = gsap.to(venueGalleryStrip, {
            x: function () {
                return -venueGalleryScrollLength;
            },
            ease: 'none',
            scrollTrigger: {
                trigger: venueSection,
                start: 'top top',
                end: function () {
                    return '+=' + getSectionScrollDistance(venueSection);
                },
                scrub: true,
                invalidateOnRefresh: true
            }
        });
    }

    setupVenueGallery();
    setupTimelineCards();
    setActiveSection(sections[0], true);
    ScrollTrigger.refresh();
    window.addEventListener('load', function () {
        if (updateGiftSequenceMetrics) {
            updateGiftSequenceMetrics();
        }
        if (updateReservationSequenceMetrics) {
            updateReservationSequenceMetrics();
        }
        refreshSplitInstances();
        setupVenueGallery();
        setupTimelineCards();
        ScrollTrigger.refresh();
    });
    window.addEventListener('resize', function () {
        if (updateGiftSequenceMetrics) {
            updateGiftSequenceMetrics();
        }
        if (updateReservationSequenceMetrics) {
            updateReservationSequenceMetrics();
        }
        refreshSplitInstances();
        setupVenueGallery();
        setupTimelineCards();
        ScrollTrigger.refresh();
    });

    function giftImageSequence(config) {
        var giftSequencePlayhead = { frame: 0 };
        var giftSequenceCanvas = gsap.utils.toArray(config.canvas)[0];
        if (!giftSequenceCanvas || !config.urls || !config.urls.length) {
            return null;
        }
        if (!giftSequenceCanvas.getContext) {
            return null;
        }
        var giftSequenceCtx = giftSequenceCanvas.getContext('2d');
        if (!giftSequenceCtx) {
            return null;
        }
        var giftSequenceCurrentFrame = -1;
        var giftSequenceOnUpdate = config.onUpdate;
        var giftSequenceFit = config.fit === 'cover' ? 'cover' : 'contain';
        var giftSequenceImages;

        function giftSequenceUpdateImage() {
            var frame = Math.round(giftSequencePlayhead.frame);
            if (frame !== giftSequenceCurrentFrame) {
                var image = giftSequenceImages[frame];
                var canvasWidth = giftSequenceCanvas.width;
                var canvasHeight = giftSequenceCanvas.height;
                var imageWidth = image && (image.naturalWidth || image.width);
                var imageHeight = image && (image.naturalHeight || image.height);
                if (!imageWidth || !imageHeight) {
                    return;
                }
                var scale = giftSequenceFit === 'cover'
                    ? Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight)
                    : Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
                var drawWidth = imageWidth * scale;
                var drawHeight = imageHeight * scale;
                var drawX = (canvasWidth - drawWidth) / 2;
                var drawY = (canvasHeight - drawHeight) / 2;
                if (config.clear !== false) {
                    giftSequenceCtx.clearRect(0, 0, giftSequenceCanvas.width, giftSequenceCanvas.height);
                }
                giftSequenceCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
                giftSequenceCurrentFrame = frame;
                if (giftSequenceOnUpdate) {
                    giftSequenceOnUpdate.call(this, frame, image);
                }
            }
        }

        giftSequenceImages = config.urls.map(function (url, index) {
            var image = new Image();
            image.src = url;
            if (!index) {
                image.onload = giftSequenceUpdateImage;
            }
            return image;
        });

        var giftSequenceTween = gsap.to(giftSequencePlayhead, {
            frame: giftSequenceImages.length - 1,
            ease: 'none',
            onUpdate: giftSequenceUpdateImage,
            duration: giftSequenceImages.length / (config.fps || 30),
            paused: !!config.paused,
            scrollTrigger: config.scrollTrigger
        });
        giftSequenceTween.sequencePlayhead = giftSequencePlayhead;
        giftSequenceTween.sequenceRender = giftSequenceUpdateImage;
        return giftSequenceTween;
    }
});

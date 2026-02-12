(function initPromptConstraints(global) {
  const SCENE_RULES = [
    {
      id: "elevator",
      location: [/\belevator\b/i, /лифт/i],
      allow: {
        pose: [/\bstanding\b/i, /\bleaning\b/i, /mirror/i, /phone/i, /стоит/i, /опира/i, /зеркал/i, /телефон/i],
        accessories: [/phone/i, /bag/i, /sunglasses/i, /watch/i, /телефон/i, /сумк/i, /очки/i, /часы/i],
      },
      forbid: {
        pose: [/bench/i, /chair/i, /sofa/i, /bed/i, /lying/i, /скамей/i, /стул/i, /кресл/i, /диван/i, /кроват/i, /леж/i],
      },
      boost: {
        accessories: [{ match: [/phone/i, /телефон/i], factor: 1.7 }],
        shot_size: [{ match: [/waist/i, /chest/i, /close/i, /по пояс/i, /крупный/i], factor: 1.35 }],
      },
      fallback: {
        pose: [/\bstanding\b/i, /\bleaning\b/i, /phone/i, /стоит/i, /опира/i, /телефон/i],
      },
    },
    {
      id: "bathroom_mirror",
      location: [/bathroom/i, /mirror/i, /ванн/i, /зеркал/i],
      allow: {
        pose: [/\bstanding\b/i, /mirror/i, /phone/i, /стоит/i, /зеркал/i, /телефон/i],
      },
      forbid: {
        pose: [/bench/i, /chair/i, /bed/i, /lying/i, /скамей/i, /стул/i, /кроват/i, /леж/i],
      },
      boost: {
        accessories: [{ match: [/phone/i, /телефон/i], factor: 1.8 }],
        shot_size: [{ match: [/close/i, /waist/i, /крупный/i, /по пояс/i], factor: 1.3 }],
      },
      fallback: {
        pose: [/mirror/i, /phone/i, /\bstanding\b/i, /зеркал/i, /телефон/i, /стоит/i],
      },
    },
    {
      id: "airport",
      location: [/airport/i, /terminal/i, /gate/i, /аэропорт/i, /терминал/i, /гейт/i],
      forbid: {
        pose: [/bed/i, /lying/i, /кроват/i, /леж/i],
      },
      boost: {
        accessories: [
          { match: [/suitcase/i, /luggage/i, /carry[- ]?on/i, /чемодан/i, /багаж/i], factor: 2.4 },
          { match: [/passport/i, /паспорт/i], factor: 1.8 },
        ],
      },
      fallback: {
        pose: [/\bstanding\b/i, /walking/i, /стоит/i, /идет|идёт/i],
      },
    },
    {
      id: "car_taxi",
      location: [/\bcar\b/i, /taxi/i, /авто/i, /машин/i, /такси/i],
      allow: {
        pose: [/sitting/i, /seat/i, /window/i, /phone/i, /сид/i, /окно/i, /телефон/i],
      },
      forbid: {
        pose: [/walking/i, /run/i, /bench/i, /bridge/i, /идет|идёт/i, /беж/i, /скамей/i, /мост/i],
      },
      fallback: {
        pose: [/sitting/i, /seat/i, /window/i, /сид/i, /окно/i],
      },
    },
    {
      id: "street_outdoor",
      location: [/street/i, /crosswalk/i, /bridge/i, /park/i, /promenade/i, /улиц/i, /переход/i, /мост/i, /парк/i, /набереж/i],
      forbid: {
        pose: [/bed/i, /lying/i, /кроват/i, /леж/i],
      },
      boost: {
        accessories: [
          { match: [/phone/i, /coffee/i, /bag/i, /телефон/i, /кофе/i, /сумк/i], factor: 1.35 },
        ],
      },
      fallback: {
        pose: [/walking/i, /\bstanding\b/i, /идет|идёт/i, /стоит/i],
      },
    },
    {
      id: "gym",
      location: [/gym/i, /fitness/i, /йога/i, /спортзал/i, /wellness/i],
      forbid: {
        accessories: [/umbrella/i, /passport/i, /duty free/i, /зонт/i, /паспорт/i, /дьюти/i],
      },
      boost: {
        accessories: [
          { match: [/water bottle/i, /bottle/i, /towel/i, /бутылк/i, /полотенц/i], factor: 2.0 },
        ],
      },
    },
    {
      id: "beach_pool",
      location: [/beach/i, /pool/i, /resort/i, /пляж/i, /бассейн/i, /курорт/i],
      forbid: {
        outfit: [/coat/i, /blazer/i, /scarf/i, /перчатк/i, /пальто/i, /шарф/i, /пиджак/i],
      },
      boost: {
        accessories: [
          { match: [/sunglasses/i, /hat/i, /sun/i, /очки/i, /шляп/i], factor: 1.8 },
        ],
      },
    },
    {
      id: "office",
      location: [/office/i, /coworking/i, /meeting room/i, /lobby/i, /офис/i, /коворкинг/i, /переговор/i, /лобби/i],
      forbid: {
        outfit: [/swim/i, /beach/i, /спорт-бра/i, /пляж/i],
      },
      boost: {
        outfit: [
          { match: [/blazer/i, /shirt/i, /trousers/i, /office/i, /пиджак/i, /рубашк/i, /брюк/i, /офис/i], factor: 1.6 },
        ],
        accessories: [
          { match: [/laptop/i, /notebook/i, /телефон/i, /phone/i, /ноутбук/i], factor: 1.35 },
        ],
      },
    },
    {
      id: "rainy",
      location: [/rain/i, /wet/i, /umbrella/i, /drizzle/i, /дожд/i, /мокр/i, /луж/i, /зонт/i],
      boost: {
        accessories: [
          { match: [/umbrella/i, /hood/i, /cap/i, /coat/i, /зонт/i, /капюшон/i, /кепк/i, /плащ/i], factor: 2.4 },
        ],
        light: [
          { match: [/overcast/i, /cloudy/i, /пасмур/i, /мягкий рассеянный/i], factor: 1.6 },
        ],
      },
      fallback: {
        pose: [/walking/i, /\bstanding\b/i, /идет|идёт/i, /стоит/i],
      },
    },
  ];

  const PROFILE_RULES = [
    {
      profile: ["RAINY_DAY"],
      boost: {
        location: [{ match: [/rain/i, /wet/i, /umbrella/i, /дожд/i, /мокр/i, /зонт/i], factor: 2.6 }],
        accessories: [{ match: [/umbrella/i, /hood/i, /coat/i, /зонт/i, /капюшон/i, /плащ/i], factor: 2.2 }],
      },
    },
    {
      profile: ["WINTER"],
      boost: {
        outfit: [{ match: [/coat/i, /scarf/i, /gloves/i, /boots/i, /пальто/i, /шарф/i, /вареж/i, /перчатк/i, /сапог/i], factor: 2.1 }],
        light: [{ match: [/cold/i, /blue hour/i, /холод/i, /синий час/i], factor: 1.6 }],
      },
    },
    {
      profile: ["OFFICE", "CAFE_WORK"],
      boost: {
        outfit: [{ match: [/blazer/i, /shirt/i, /office dress/i, /пиджак/i, /рубашк/i, /офис/i], factor: 1.9 }],
        location: [{ match: [/office/i, /coworking/i, /meeting/i, /офис/i, /коворкинг/i, /переговор/i], factor: 1.7 }],
      },
    },
    {
      profile: ["DATE_NIGHT", "NIGHT_CITY"],
      boost: {
        light: [{ match: [/night/i, /neon/i, /warm indoor/i, /ноч/i, /неон/i, /тёпл/i, /тепл/i], factor: 2.0 }],
        location: [{ match: [/restaurant/i, /bar/i, /night/i, /street/i, /ресторан/i, /бар/i, /вечер/i], factor: 1.7 }],
      },
    },
  ];

  const SAFE_FALLBACK = {
    pose: [/\bstanding\b/i, /walking/i, /стоит/i, /идет|идёт/i],
    accessories: [/phone/i, /bag/i, /coffee/i, /телефон/i, /сумк/i, /кофе/i],
    outfit: [/casual/i, /jeans/i, /shirt/i, /платье/i, /джинс/i, /рубашк/i, /повседнев/i],
    shot_size: [/waist/i, /mid/i, /по пояс/i, /средний/i],
    location: [/street/i, /cafe/i, /home/i, /park/i, /улиц/i, /кафе/i, /дом/i, /парк/i],
  };

  function itemText(item) {
    const labelRu = item?.label?.ru || "";
    const labelEn = item?.label?.en || "";
    const promptRu = item?.prompt?.ru || "";
    const promptEn = item?.prompt?.en || "";
    const tags = Array.isArray(item?.tags) ? item.tags.join(" ") : "";
    return `${labelRu} ${labelEn} ${promptRu} ${promptEn} ${tags}`.toLowerCase();
  }

  function matches(text, patterns) {
    if (!Array.isArray(patterns) || !patterns.length) return false;
    return patterns.some((pattern) => pattern.test(text));
  }

  function getBlock(profile, key) {
    return (profile.blocks || []).find((block) => block.key === key);
  }

  function getSingleSelectedItem(profile, state, key) {
    const block = getBlock(profile, key);
    if (!block || block.type !== "single") return null;
    const idx = state[key];
    if (idx === undefined || !block.items[idx]) return null;
    return block.items[idx];
  }

  function getSceneRule(locationItem) {
    if (!locationItem) return null;
    const text = itemText(locationItem);
    return SCENE_RULES.find((rule) => matches(text, rule.location));
  }

  function isMirrorLocationItem(locationItem) {
    const text = itemText(locationItem);
    return matches(text, [/mirror/i, /bathroom/i, /зеркал/i, /ванн/i]);
  }

  function isPhoneItem(item) {
    const text = itemText(item);
    return matches(text, [/phone/i, /iphone/i, /телефон/i]);
  }

  function findPhoneIndex(profile, state, getAllowedIndices) {
    const block = getBlock(profile, "accessories");
    if (!block) return undefined;
    const allowed = getAllowedIndices(block);
    for (const idx of allowed) {
      const item = block.items[idx];
      if (item && isPhoneItem(item)) return idx;
    }
    return undefined;
  }

  function isPhoneSelected(profile, state) {
    const block = getBlock(profile, "accessories");
    if (!block) return false;
    if (block.type === "single") {
      const idx = state.accessories;
      return idx !== undefined && isPhoneItem(block.items[idx]);
    }
    const arr = Array.isArray(state.accessories) ? state.accessories : [];
    return arr.some((idx) => isPhoneItem(block.items[idx]));
  }

  function isHandsVisiblePose(profile, state) {
    const poseItem = getSingleSelectedItem(profile, state, "pose");
    if (!poseItem) return false;
    return matches(itemText(poseItem), [/hands visible/i, /рук/i]);
  }

  function getShotSizeItem(profile, state) {
    return getSingleSelectedItem(profile, state, "shot_size")
      || getSingleSelectedItem(profile, state, "framing");
  }

  function isCloseOrWaistFraming(profile, state) {
    const shotItem = getShotSizeItem(profile, state);
    if (!shotItem) return false;
    return matches(itemText(shotItem), [/close/i, /waist/i, /chest/i, /крупн/i, /по пояс/i, /по груд/i]);
  }

  function isFullBodyFraming(profile, state) {
    const shotItem = getShotSizeItem(profile, state);
    if (!shotItem) return false;
    return matches(itemText(shotItem), [/full body/i, /full-body/i, /в полный рост/i, /полный рост/i]);
  }

  function isMirrorSelfieAngle(profile, state) {
    const angleItem = getSingleSelectedItem(profile, state, "camera_angle");
    if (!angleItem) return false;
    return matches(itemText(angleItem), [/mirror selfie/i, /зеркал/i]);
  }

  function getPhoneRuleMeta(profile, state, getAllowedIndices) {
    const locationItem = getSingleSelectedItem(profile, state, "location");
    const mirrorScene = Boolean(locationItem && isMirrorLocationItem(locationItem));
    const closeOrWaist = isCloseOrWaistFraming(profile, state);
    const handsVisible = isHandsVisiblePose(profile, state);
    const mirrorAngle = isMirrorSelfieAngle(profile, state);
    const fullBody = isFullBodyFraming(profile, state);
    let phoneRequired = mirrorScene || mirrorAngle || closeOrWaist || (mirrorScene && handsVisible);
    if (!mirrorScene && !mirrorAngle && fullBody) phoneRequired = false;
    const phoneIndex = findPhoneIndex(profile, state, getAllowedIndices);
    const phoneSelected = isPhoneSelected(profile, state);
    const phoneRecommended = mirrorScene || mirrorAngle || closeOrWaist || (handsVisible && mirrorScene);
    const phoneOptional = !mirrorScene && !mirrorAngle && fullBody;
    return { mirrorScene, phoneRequired, phoneRecommended, phoneOptional, phoneIndex, phoneSelected };
  }

  function getProfileRules(profileKey) {
    return PROFILE_RULES.filter((rule) => Array.isArray(rule.profile) && rule.profile.includes(profileKey));
  }

  function isItemAllowedByRule(rule, blockKey, item) {
    if (!rule || !item) return true;
    const text = itemText(item);
    const forbidPatterns = rule.forbid?.[blockKey];
    if (matches(text, forbidPatterns)) return false;
    const allowPatterns = rule.allow?.[blockKey];
    if (Array.isArray(allowPatterns) && allowPatterns.length && !matches(text, allowPatterns)) return false;
    return true;
  }

  function isLocationCandidateCompatible(profile, state, locationItem) {
    const rule = getSceneRule(locationItem);
    if (!rule) return true;

    const singleKeys = ["pose", "outfit", "shot_size", "camera_angle", "framing"];
    for (const key of singleKeys) {
      const selected = getSingleSelectedItem(profile, state, key);
      if (!selected) continue;
      if (!isItemAllowedByRule(rule, key, selected)) return false;
    }

    const accessoriesBlock = getBlock(profile, "accessories");
    if (accessoriesBlock && accessoriesBlock.type !== "single") {
      const selected = Array.isArray(state.accessories) ? state.accessories : [];
      for (const idx of selected) {
        const item = accessoriesBlock.items[idx];
        if (!item) continue;
        if (!isItemAllowedByRule(rule, "accessories", item)) return false;
      }
    }

    return true;
  }

  function findFirstMatch(indices, items, patterns) {
    if (!Array.isArray(indices)) return undefined;
    for (const idx of indices) {
      const item = items[idx];
      if (!item) continue;
      if (matches(itemText(item), patterns)) return idx;
    }
    return undefined;
  }

  function filterCompatibleIndices(profile, state, block, indices) {
    if (!Array.isArray(indices) || !indices.length) return [];
    if (!block || !block.key) return indices.slice();

    if (block.key === "location") {
      return indices.filter((idx) => {
        const item = block.items[idx];
        return item ? isLocationCandidateCompatible(profile, state, item) : false;
      });
    }

    const locationItem = getSingleSelectedItem(profile, state, "location");
    const sceneRule = getSceneRule(locationItem);

    if (!sceneRule) return indices.slice();

    const allowPatterns = sceneRule.allow?.[block.key];
    const forbidPatterns = sceneRule.forbid?.[block.key];

    return indices.filter((idx) => {
      const item = block.items[idx];
      if (!item) return false;
      const text = itemText(item);
      if (matches(text, forbidPatterns)) return false;
      if (Array.isArray(allowPatterns) && allowPatterns.length && !matches(text, allowPatterns)) return false;
      return true;
    });
  }

  function getWeightFactor(profile, state, block, item) {
    let factor = 1;
    const text = itemText(item);

    const locationItem = getSingleSelectedItem(profile, state, "location");
    const sceneRule = getSceneRule(locationItem);

    if (sceneRule) {
      const boosts = Array.isArray(sceneRule.boost?.[block.key]) ? sceneRule.boost[block.key] : [];
      boosts.forEach((entry) => {
        const mul = Number(entry?.factor);
        if (Number.isFinite(mul) && mul > 0 && matches(text, entry.match)) factor *= mul;
      });
    }

    getProfileRules(profile.key).forEach((rule) => {
      const boosts = Array.isArray(rule.boost?.[block.key]) ? rule.boost[block.key] : [];
      boosts.forEach((entry) => {
        const mul = Number(entry?.factor);
        if (Number.isFinite(mul) && mul > 0 && matches(text, entry.match)) factor *= mul;
      });
    });

    return factor;
  }

  function findFirstPoseIndex(block, patterns, fallbackIndices) {
    const pool = Array.isArray(fallbackIndices) && fallbackIndices.length
      ? fallbackIndices
      : [...Array(block.items.length).keys()];
    return findFirstMatch(pool, block.items, patterns);
  }

  function enforcePoseReplacement(profile, state, options = {}) {
    const getAllowedIndices = typeof options.getAllowedIndices === "function"
      ? options.getAllowedIndices
      : (block) => [...Array(block.items.length).keys()];
    const poseBlock = getBlock(profile, "pose");
    if (!poseBlock || poseBlock.type !== "single") return { changed: false, warning: "" };
    const poseIdx = state.pose;
    if (poseIdx === undefined || !poseBlock.items[poseIdx]) return { changed: false, warning: "" };
    const poseText = itemText(poseBlock.items[poseIdx]);
    const locationItem = getSingleSelectedItem(profile, state, "location");
    const locationText = itemText(locationItem);
    const shotItem = getShotSizeItem(profile, state);
    const shotText = itemText(shotItem);
    const allowedPose = getAllowedIndices(poseBlock);
    let replacement;
    let warning = "";

    if (matches(locationText, [/elevator/i, /лифт/i]) && matches(poseText, [/bench/i, /seated/i, /chair/i, /скамей/i, /сид/i])) {
      replacement = findFirstPoseIndex(poseBlock, [/\bstanding\b/i, /\bleaning\b/i, /стоит/i, /облокот/i], allowedPose);
      warning = "Несовместимо: лифт + поза на скамье. Поза заменена.";
    }

    if (!replacement && matches(locationText, [/bathroom/i, /mirror/i, /ванн/i, /зеркал/i]) && matches(poseText, [/bench/i, /seated/i, /скамей/i, /сид/i])) {
      replacement = findFirstPoseIndex(poseBlock, [/\bstanding\b/i, /mirror/i, /стоит/i, /зеркал/i], allowedPose);
      warning = "Несовместимо: зеркальная сцена + сидячая поза. Поза заменена.";
    }

    if (!replacement && matches(shotText, [/extreme close-up/i, /экстремальный крупный/i]) && matches(poseText, [/walking/i, /run/i, /идет|идёт/i, /беж/i, /full body/i, /полный рост/i])) {
      replacement = findFirstPoseIndex(poseBlock, [/\bstanding\b/i, /стоит/i], allowedPose);
      warning = "Несовместимо: экстремальный крупный план + динамичная поза. Поза заменена.";
    }

    if (replacement === undefined || replacement === poseIdx) return { changed: false, warning: "" };
    state.pose = replacement;
    return { changed: true, warning };
  }

  function replaceInvalidSingle(profile, state, block, allowedIndices, compatibleIndices, sceneRule) {
    const current = state[block.key];
    if (current === undefined || !block.items[current]) return false;
    if (compatibleIndices.includes(current)) return false;

    const fallbackPatterns = sceneRule?.fallback?.[block.key] || SAFE_FALLBACK[block.key] || [];
    const replacement = findFirstMatch(compatibleIndices, block.items, fallbackPatterns)
      ?? findFirstMatch(compatibleIndices, block.items, SAFE_FALLBACK[block.key] || [])
      ?? compatibleIndices[0]
      ?? findFirstMatch(allowedIndices, block.items, SAFE_FALLBACK[block.key] || [])
      ?? allowedIndices[0];

    if (replacement === undefined || replacement === current) return false;
    state[block.key] = replacement;
    return true;
  }

  function enforceConstraints(profile, state, options = {}) {
    if (!profile || !state) return { changed: false, changedBlocks: [] };

    const getAllowedIndices = typeof options.getAllowedIndices === "function"
      ? options.getAllowedIndices
      : (block) => [...Array(block.items.length).keys()];
    const isLocked = typeof options.isLocked === "function" ? options.isLocked : () => false;

    const changedBlocks = [];
    const locationItem = getSingleSelectedItem(profile, state, "location");
    const sceneRule = getSceneRule(locationItem);
    const keysToCheck = ["location", "pose", "accessories", "outfit", "shot_size", "camera_angle"];

    keysToCheck.forEach((key) => {
      const block = getBlock(profile, key);
      if (!block) return;
      if (isLocked(block.key)) return;

      const allowedIndices = getAllowedIndices(block);
      const compatibleIndices = filterCompatibleIndices(profile, state, block, allowedIndices);
      const pool = compatibleIndices.length ? compatibleIndices : allowedIndices;

      if (block.type === "single") {
        const changed = replaceInvalidSingle(profile, state, block, allowedIndices, pool, sceneRule);
        if (changed) changedBlocks.push(block.key);
        return;
      }

      const selected = Array.isArray(state[block.key]) ? state[block.key] : [];
      const set = new Set(pool);
      const filtered = selected.filter((idx) => set.has(idx));
      if (filtered.length !== selected.length) {
        state[block.key] = filtered;
        changedBlocks.push(block.key);
      }
    });

    return {
      changed: changedBlocks.length > 0,
      changedBlocks,
    };
  }

  function applyAutoRules(profile, state, options = {}) {
    if (!profile || !state) return { changed: false, phoneAutoAdded: false, phoneRequired: false, phoneRecommended: false };

    const getAllowedIndices = typeof options.getAllowedIndices === "function"
      ? options.getAllowedIndices
      : (block) => [...Array(block.items.length).keys()];
    const isLocked = typeof options.isLocked === "function" ? options.isLocked : () => false;
    const forcePhone = Boolean(options.forcePhone);
    const allowPhoneAutofill = options.allowPhoneAutofill !== false;

    const meta = getPhoneRuleMeta(profile, state, getAllowedIndices);
    const block = getBlock(profile, "accessories");
    const poseItem = getSingleSelectedItem(profile, state, "pose");
    const poseText = itemText(poseItem);
    const autoAddedAccessories = [];
    let changed = false;
    let phoneAutoAdded = false;
    let warning = "";

    function findAccessoryIndex(patterns) {
      if (!block) return undefined;
      const allowed = getAllowedIndices(block);
      for (const idx of allowed) {
        const item = block.items[idx];
        if (!item) continue;
        if (matches(itemText(item), patterns)) return idx;
      }
      return undefined;
    }

    function ensureAccessory(index, reason, strict = false, trackExisting = false) {
      if (index === undefined || !block || isLocked("accessories")) return false;
      if (block.type === "single") {
        if (state.accessories === index) {
          if (trackExisting) autoAddedAccessories.push({ index, reason, strict });
          return false;
        }
        state.accessories = index;
        autoAddedAccessories.push({ index, reason, strict });
        return true;
      }

      const current = Array.isArray(state.accessories) ? state.accessories.slice() : [];
      if (current.includes(index)) {
        if (trackExisting) autoAddedAccessories.push({ index, reason, strict });
        return false;
      }
      const limit = Number(block.limit) > 0 ? Number(block.limit) : current.length + 1;
      if (current.length >= limit) {
        const removableIdx = current.findIndex((entry) => entry !== index);
        if (removableIdx >= 0) current.splice(removableIdx, 1);
        else current.shift();
      }
      current.push(index);
      state.accessories = current;
      autoAddedAccessories.push({ index, reason, strict });
      return true;
    }

    if (block && !isLocked("accessories")) {
      if (matches(poseText, [/(fix|adjust).*(glasses)/i, /поправля.*очк/i])) {
        const glassesIdx = findAccessoryIndex([/glasses/i, /очки/i]);
        if (ensureAccessory(glassesIdx, "Автодобавлено: очки (из-за позы).", true, true)) {
          changed = true;
          warning = "Автодобавлено: очки (из-за позы).";
        }
      }

      if (matches(poseText, [/(drink|holding).*(coffee|cup)/i, /пь[её]т.*кофе/i, /чашк/i])) {
        const coffeeIdx = findAccessoryIndex([/coffee/i, /cup/i, /кофе/i, /чаш/i]);
        if (ensureAccessory(coffeeIdx, "Автодобавлено: кофе (из-за позы).", false, true)) {
          changed = true;
          warning = warning || "Автодобавлено: кофе (из-за позы).";
        }
      }

      if (allowPhoneAutofill && matches(poseText, [/(phone|texting|looking at phone)/i, /смотрит.*телефон/i, /в телефон/i])) {
        const phoneIdxByPose = findAccessoryIndex([/phone/i, /iphone/i, /телефон/i]);
        if (ensureAccessory(phoneIdxByPose, "Автодобавлено: телефон (из-за позы).", true, true)) {
          changed = true;
          phoneAutoAdded = true;
          warning = warning || "Автодобавлено: телефон (из-за позы).";
        }
      }
    }

    if (allowPhoneAutofill && block && meta.phoneRequired && forcePhone && meta.phoneIndex !== undefined && !isLocked("accessories")) {
      if (ensureAccessory(meta.phoneIndex, "Автодобавлено: телефон (зеркальная сцена).", true, true)) {
        changed = true;
        phoneAutoAdded = true;
        warning = warning || "Автодобавлено: телефон (зеркальная сцена).";
      }
    }

    const poseFix = enforcePoseReplacement(profile, state, { getAllowedIndices });
    if (poseFix.changed) {
      changed = true;
      warning = warning || poseFix.warning;
    }

    return {
      changed,
      phoneAutoAdded,
      phoneRequired: meta.phoneRequired,
      phoneRecommended: meta.phoneRecommended,
      autoAddedAccessories,
      warning,
    };
  }

  global.PROMPT_CONSTRAINTS = {
    rules: SCENE_RULES,
    profileRules: PROFILE_RULES,
    filterCompatibleIndices,
    getWeightFactor,
    enforceConstraints,
    getPhoneRuleMeta,
    applyAutoRules,
  };
})(window);

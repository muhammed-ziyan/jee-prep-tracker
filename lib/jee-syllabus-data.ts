/**
 * JEE Main Paper 1 (B.E./B.Tech.) official syllabus - Mathematics, Physics, Chemistry.
 * Source: JEE Main 2026 syllabus PDF.
 * Each topic is a single phrase (split by comma/semicolon); scope = Class 11 / Class 12.
 */

export type TopicSeed = {
  name: string;
  order: number;
  isImportant: boolean;
  isClass11: boolean;
  isClass12: boolean;
};

export type SubjectSeed = {
  name: string;
  color: string;
  units: { name: string; order: number; topics: TopicSeed[] }[];
};

function splitPhrases(s: string): string[] {
  return s
    .split(/[,;]/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getScope(
  subjectName: string,
  unitOrder: number,
  phrase: string
): { isClass11: boolean; isClass12: boolean } {
  const lower = phrase.toLowerCase();

  if (subjectName === "Physics") {
    if (unitOrder >= 1 && unitOrder <= 10) return { isClass11: true, isClass12: false };
    return { isClass11: false, isClass12: true };
  }

  if (subjectName === "Maths") {
    const class11OnlyUnits = [1, 2, 4, 5, 6, 10, 14];
    const class12OnlyUnits = [3, 7, 8, 9, 11, 12];
    if (class11OnlyUnits.includes(unitOrder)) return { isClass11: true, isClass12: false };
    if (class12OnlyUnits.includes(unitOrder)) return { isClass11: false, isClass12: true };
    if (unitOrder === 13) {
      const stats =
        /dispersion|mean|median|mode|deviation|variance|standard\s*deviation|grouped|ungrouped/.test(
          lower
        );
      const prob = /probability|bayes?|random\s*variable|distribution/.test(lower);
      if (stats && !prob) return { isClass11: true, isClass12: false };
      if (prob) return { isClass11: false, isClass12: true };
      return { isClass11: true, isClass12: false };
    }
  }

  if (subjectName === "Chemistry") {
    const class11OnlyUnits = [1, 2, 3, 4, 6, 9, 13, 14, 15];
    const class12OnlyUnits = [5, 8, 11, 12, 16, 17, 18, 19, 20];
    if (class11OnlyUnits.includes(unitOrder)) return { isClass11: true, isClass12: false };
    if (class12OnlyUnits.includes(unitOrder)) return { isClass11: false, isClass12: true };
    if (unitOrder === 7) {
      const redox =
        /redox|oxidation\s*number|balancing\s*redox|electronic\s*concepts\s*of\s*oxidation|^oxidation\s|oxidation\s+and\s+reduction|reduction\s+and\s+oxidation/.test(
          lower
        );
      const electro =
        /electrolytic|galvanic|nernst|electrode\s*potential|conductance|kohlrausch|electrochemical\s*cell|emf|dry\s*cell|lead\s*accumulator|fuel\s*cell|half-cell|half\s*cell/.test(
          lower
        );
      if (redox && !electro) return { isClass11: true, isClass12: false };
      if (electro) return { isClass11: false, isClass12: true };
      return { isClass11: true, isClass12: false };
    }
    if (unitOrder === 10) {
      const fullRange = /group\s*13\s*to\s*18|13\s*to\s*18/.test(lower);
      const group1518 =
        /group\s*15|group\s*16|group\s*17|group\s*18|nitrogen|oxygen|fluorine|chlorine|noble\s*gases|p\s*block/.test(
          lower
        );
      const group1314 =
        /group\s*13|group\s*14|boron|carbon\s*family|first\s*element\s*in\s*each\s*group|unique\s*behaviour/.test(
          lower
        );
      if (fullRange || group1518) return { isClass11: false, isClass12: true };
      if (group1314) return { isClass11: true, isClass12: false };
      return { isClass11: false, isClass12: true };
    }
  }

  return { isClass11: true, isClass12: true };
}

type RawTopic = {
  name: string;
  order: number;
  isImportant: boolean;
  /** When set, use for all phrases in this topic block instead of getScope() */
  class11?: boolean;
  class12?: boolean;
};

function expandUnitTopics(
  subjectName: string,
  unitOrder: number,
  rawTopics: RawTopic[]
): TopicSeed[] {
  const result: TopicSeed[] = [];
  let order = 1;
  for (const t of rawTopics) {
    const phrases = splitPhrases(t.name);
    const useOverride = t.class11 !== undefined || t.class12 !== undefined;
    const override11 = t.class11 ?? true;
    const override12 = t.class12 ?? true;
    for (const phrase of phrases) {
      const scope = useOverride
        ? { isClass11: override11, isClass12: override12 }
        : getScope(subjectName, unitOrder, phrase);
      result.push({
        name: phrase,
        order: order++,
        isImportant: t.isImportant,
        isClass11: scope.isClass11,
        isClass12: scope.isClass12,
      });
    }
  }
  return result;
}

const RAW_SYLLABUS: {
  name: string;
  color: string;
  units: { name: string; order: number; topics: RawTopic[] }[];
}[] = [
  {
    name: "Maths",
    color: "#3B82F6",
    units: [
      {
        name: "Sets, Relations and Functions",
        order: 1,
        topics: [
          {
            name: "Sets and their representation; Union, intersection and complement of sets and their algebraic properties",
            order: 1,
            isImportant: true,
          },
          { name: "Power set", order: 2, isImportant: false },
          {
            name: "Relations, type of relations, equivalence relations, functions",
            order: 3,
            isImportant: true,
          },
          {
            name: "One-one, into and onto functions, the composition of functions",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Complex Numbers and Quadratic Equations",
        order: 2,
        topics: [
          {
            name: "Complex numbers as ordered pairs of reals, Representation in form a+ib and Argand diagram",
            order: 1,
            isImportant: true,
          },
          {
            name: "Algebra of complex numbers, modulus and argument (amplitude)",
            order: 2,
            isImportant: true,
          },
          {
            name: "Quadratic equations in real and complex number systems and their solutions",
            order: 3,
            isImportant: true,
          },
          {
            name: "Relations between roots and coefficients, nature of roots, formation of quadratic equations with given roots",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Matrices and Determinants",
        order: 3,
        topics: [
          { name: "Matrices, algebra of matrices, type of matrices", order: 1, isImportant: true },
          {
            name: "Determinants and matrices of order two and three, evaluation of determinants",
            order: 2,
            isImportant: true,
          },
          { name: "Area of triangles using determinants", order: 3, isImportant: false },
          { name: "Adjoint and inverse of a square matrix", order: 4, isImportant: true },
          {
            name: "Test of consistency and solution of simultaneous linear equations in two or three variables using matrices",
            order: 5,
            isImportant: true,
          },
        ],
      },
      {
        name: "Permutations and Combinations",
        order: 4,
        topics: [
          {
            name: "Fundamental principle of counting, permutations and combinations",
            order: 1,
            isImportant: true,
          },
          { name: "Meaning of P(n,r) and C(n,r). Simple applications", order: 2, isImportant: true },
        ],
      },
      {
        name: "Binomial Theorem and its Simple Applications",
        order: 5,
        topics: [
          {
            name: "Binomial theorem for a positive integral index, general term and middle term",
            order: 1,
            isImportant: true,
          },
          { name: "Simple applications", order: 2, isImportant: true },
        ],
      },
      {
        name: "Sequence and Series",
        order: 6,
        topics: [
          { name: "Arithmetic and Geometric progressions", order: 1, isImportant: true },
          {
            name: "Insertion of arithmetic, geometric means between two given numbers",
            order: 2,
            isImportant: false,
          },
          { name: "Relation between A.M and G.M", order: 3, isImportant: true },
        ],
      },
      {
        name: "Limit, Continuity and Differentiability",
        order: 7,
        topics: [
          {
            name: "Real-valued functions, algebra of functions; polynomial, rational, trigonometric, logarithmic and exponential functions",
            order: 1,
            isImportant: true,
          },
          { name: "Inverse functions. Graphs of simple functions", order: 2, isImportant: false },
          { name: "Limits, continuity and differentiability", order: 3, isImportant: true },
          {
            name: "Differentiation of sum, difference, product and quotient of two functions",
            order: 4,
            isImportant: true,
          },
          {
            name: "Differentiation of trigonometric, inverse trigonometric, logarithmic, exponential, composite and implicit functions",
            order: 5,
            isImportant: true,
          },
          { name: "Derivatives of order upto two", order: 6, isImportant: true },
          {
            name: "Applications of derivatives: Rate of change, monotonic functions, Maxima and minima of functions of one variable",
            order: 7,
            isImportant: true,
          },
        ],
      },
      {
        name: "Integral Calculus",
        order: 8,
        topics: [
          {
            name: "Integral as an anti-derivative, Fundamental integrals involving algebraic, trigonometric, exponential and logarithmic functions",
            order: 1,
            isImportant: true,
          },
          {
            name: "Integration by substitution, by parts and by partial fractions. Integration using trigonometric identities",
            order: 2,
            isImportant: true,
          },
          {
            name: "Fundamental theorem of calculus, properties of definite integrals",
            order: 3,
            isImportant: true,
          },
          {
            name: "Evaluation of definite integrals, determining areas of regions bounded by simple curves",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Differential Equations",
        order: 9,
        topics: [
          {
            name: "Ordinary differential equations, their order and degree",
            order: 1,
            isImportant: true,
          },
          {
            name: "Solution by method of separation of variables",
            order: 2,
            isImportant: true,
          },
          {
            name: "Solution of homogeneous and linear differential equation of first order",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Co-ordinate Geometry",
        order: 10,
        topics: [
          {
            name: "Cartesian system, distance formula, section formula, locus and its equation, slope of a line",
            order: 1,
            isImportant: true,
          },
          {
            name: "Straight line: Various forms of equations, intersection of lines, angles between two lines",
            order: 2,
            isImportant: true,
          },
          {
            name: "Distance of a point from a line, centroid, orthocentre and circumcentre of a triangle",
            order: 3,
            isImportant: true,
          },
          {
            name: "Circle: Standard and general form, radius and centre, equation when endpoints of diameter are given",
            order: 4,
            isImportant: true,
          },
          {
            name: "Conic sections: Parabola, ellipse and hyperbola in standard forms",
            order: 5,
            isImportant: true,
          },
        ],
      },
      {
        name: "Three Dimensional Geometry",
        order: 11,
        topics: [
          {
            name: "Coordinates of a point in space, distance between two points, section formula",
            order: 1,
            isImportant: true,
          },
          {
            name: "Direction ratios and direction cosines, angle between two intersecting lines",
            order: 2,
            isImportant: true,
          },
          {
            name: "Equation of a line; Skew lines, shortest distance between them",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Vector Algebra",
        order: 12,
        topics: [
          { name: "Vectors and scalars, addition of vectors", order: 1, isImportant: true },
          {
            name: "Components of a vector in two and three dimensions",
            order: 2,
            isImportant: true,
          },
          { name: "Scalar and vector products", order: 3, isImportant: true },
        ],
      },
      {
        name: "Statistics and Probability",
        order: 13,
        topics: [
          {
            name: "Measures of dispersion; calculation of mean, median, mode of grouped and ungrouped data, calculation of standard deviation, variance and mean deviation for grouped and ungrouped data.",
            order: 1,
            isImportant: true,
            class11: true,
            class12: false,
          },
          {
            name: "Probability: Probability of an event, addition and multiplication theorems of probability, Baye's theorem, probability distribution of a random variable",
            order: 2,
            isImportant: true,
            class11: false,
            class12: true,
          },
        ],
      },
      {
        name: "Trigonometry",
        order: 14,
        topics: [
          {
            name: "Trigonometrical identities and trigonometrical functions",
            order: 1,
            isImportant: true,
          },
          {
            name: "Inverse trigonometrical functions and their properties",
            order: 2,
            isImportant: true,
          },
        ],
      },
    ],
  },
  {
    name: "Physics",
    color: "#EF4444",
    units: [
      {
        name: "Units and Measurements",
        order: 1,
        topics: [
          {
            name: "Units of measurements, System of units, SI Units, fundamental and derived units",
            order: 1,
            isImportant: true,
          },
          {
            name: "Least count, significant figures, Errors in measurements",
            order: 2,
            isImportant: true,
          },
          {
            name: "Dimensions of Physics quantities, dimensional analysis and its applications",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Kinematics",
        order: 2,
        topics: [
          {
            name: "Frame of reference, motion in a straight line, speed and velocity, uniform and non-uniform motion",
            order: 1,
            isImportant: true,
          },
          {
            name: "Uniformly accelerated motion, velocity-time, position-time graph, relations for uniformly accelerated motion",
            order: 2,
            isImportant: true,
          },
          {
            name: "Relative velocity. Motion in a plane, projectile motion, uniform circular motion",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Laws of Motion",
        order: 3,
        topics: [
          {
            name: "Force and inertia, Newton's first law, momentum, Newton's second law, impulse, Newton's third law",
            order: 1,
            isImportant: true,
          },
          {
            name: "Law of conservation of linear momentum and its applications",
            order: 2,
            isImportant: true,
          },
          {
            name: "Static and Kinetic friction, laws of friction, rolling friction",
            order: 3,
            isImportant: true,
          },
          {
            name: "Dynamics of uniform circular motion, centripetal force; vehicle on level and banked road",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Work, Energy and Power",
        order: 4,
        topics: [
          {
            name: "Work done by constant and variable force, kinetic and potential energies, work-energy theorem, power",
            order: 1,
            isImportant: true,
          },
          {
            name: "Potential energy of a spring, conservation of mechanical energy",
            order: 2,
            isImportant: true,
          },
          {
            name: "Conservative and non-conservative forces, motion in a vertical circle",
            order: 3,
            isImportant: true,
          },
          {
            name: "Elastic and inelastic collisions in one and two dimensions",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Rotational Motion",
        order: 5,
        topics: [
          {
            name: "Centre of mass of two-particle system and rigid body",
            order: 1,
            isImportant: true,
          },
          {
            name: "Basic concepts of rotational motion, moment of force, torque, angular momentum, conservation of angular momentum",
            order: 2,
            isImportant: true,
          },
          {
            name: "Moment of inertia, radius of gyration, values for simple geometrical objects",
            order: 3,
            isImportant: true,
          },
          {
            name: "Parallel and perpendicular axes theorems. Equilibrium of rigid bodies, equations of rotational motion",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Gravitation",
        order: 6,
        topics: [
          {
            name: "Universal law of gravitation. Acceleration due to gravity and its variation with altitude and depth",
            order: 1,
            isImportant: true,
          },
          {
            name: "Kepler's law of planetary motion. Gravitational potential energy, gravitational potential",
            order: 2,
            isImportant: true,
          },
          {
            name: "Escape velocity, motion of a satellite, orbital velocity, time period and energy of satellite",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Properties of Solids and Liquids",
        order: 7,
        topics: [
          {
            name: "Elastic behaviour, stress-strain, Hooke's Law, Young's modulus, bulk modulus, modulus of rigidity",
            order: 1,
            isImportant: true,
          },
          {
            name: "Pressure due to fluid column, Pascal's law, effect of gravity on fluid pressure",
            order: 2,
            isImportant: true,
          },
          {
            name: "Viscosity, Stoke's law, terminal velocity, streamline and turbulent flow, Bernoulli's principle",
            order: 3,
            isImportant: true,
          },
          {
            name: "Surface energy and surface tension, angle of contact, excess pressure, drops, bubbles, capillary rise",
            order: 4,
            isImportant: true,
          },
          {
            name: "Heat, temperature, thermal expansion, specific heat, calorimetry, change of state, latent heat. Heat transfer: conduction, convection, radiation",
            order: 5,
            isImportant: true,
          },
        ],
      },
      {
        name: "Thermodynamics",
        order: 8,
        topics: [
          {
            name: "Thermal equilibrium, zeroth law, heat, work and internal energy",
            order: 1,
            isImportant: true,
          },
          {
            name: "First law of thermodynamics, isothermal and adiabatic processes",
            order: 2,
            isImportant: true,
          },
          {
            name: "Second law: reversible and irreversible processes",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Kinetic Theory of Gases",
        order: 9,
        topics: [
          {
            name: "Equation of state of perfect gas, work done on compressing a gas",
            order: 1,
            isImportant: true,
          },
          {
            name: "Kinetic theory: assumptions, concept of pressure, kinetic interpretation of temperature, RMS speed",
            order: 2,
            isImportant: true,
          },
          {
            name: "Degrees of freedom, law of equipartition, specific heat capacities of gases, mean free path, Avogadro's number",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Oscillations and Waves",
        order: 10,
        topics: [
          {
            name: "Oscillations: time period, frequency, displacement as function of time",
            order: 1,
            isImportant: true,
          },
          {
            name: "Simple harmonic motion (S.H.M.), phase, spring oscillations, energy in S.H.M., simple pendulum",
            order: 2,
            isImportant: true,
          },
          {
            name: "Wave motion, longitudinal and transverse waves, speed of travelling wave, displacement relation for progressive wave",
            order: 3,
            isImportant: true,
          },
          {
            name: "Superposition of waves, reflection, standing waves in strings and organ pipes, fundamental mode and harmonics, beats",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Electrostatics",
        order: 11,
        topics: [
          {
            name: "Electric charges, Coulomb's law, forces between multiple charges, superposition, continuous charge distribution",
            order: 1,
            isImportant: true,
          },
          {
            name: "Electric field, field lines, electric dipole, torque on dipole in uniform field",
            order: 2,
            isImportant: true,
          },
          {
            name: "Electric flux, Gauss's law and applications (wire, plane sheet, spherical shell)",
            order: 3,
            isImportant: true,
          },
          {
            name: "Electric potential, potential difference, equipotential surfaces, electrical potential energy",
            order: 4,
            isImportant: true,
          },
          {
            name: "Conductors and insulators, dielectrics, capacitors and capacitance, combination of capacitors, energy stored",
            order: 5,
            isImportant: true,
          },
        ],
      },
      {
        name: "Current Electricity",
        order: 12,
        topics: [
          {
            name: "Electric current, drift velocity, mobility, Ohm's law, resistance, I-V characteristics",
            order: 1,
            isImportant: true,
          },
          {
            name: "Electrical energy and power, resistivity and conductivity, series and parallel combinations, temperature dependence",
            order: 2,
            isImportant: true,
          },
          {
            name: "Internal resistance, emf, combination of cells. Kirchhoff's laws, Wheatstone bridge, Metre Bridge",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Magnetic Effects of Current and Magnetism",
        order: 13,
        topics: [
          {
            name: "Biot-Savart law, Ampere's law and applications (straight wire, solenoid)",
            order: 1,
            isImportant: true,
          },
          {
            name: "Force on moving charge and current-carrying conductor in magnetic field",
            order: 2,
            isImportant: true,
          },
          {
            name: "Torque on current loop, moving coil galvanometer, conversion to ammeter and voltmeter",
            order: 3,
            isImportant: true,
          },
          {
            name: "Current loop as magnetic dipole, bar magnet, para-, dia- and ferromagnetic substances",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Electromagnetic Induction and Alternating Currents",
        order: 14,
        topics: [
          {
            name: "Faraday's law, induced emf and current, Lenz's law, eddy currents, self and mutual inductance",
            order: 1,
            isImportant: true,
          },
          {
            name: "Alternating currents, peak and RMS value, reactance and impedance, LCR series circuit, resonance",
            order: 2,
            isImportant: true,
          },
          {
            name: "Power in AC circuits, wattless current, AC generator and transformer",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Electromagnetic Waves",
        order: 15,
        topics: [
          {
            name: "Displacement current, electromagnetic waves and their characteristics",
            order: 1,
            isImportant: true,
          },
          {
            name: "Electromagnetic spectrum (radio, microwaves, infrared, visible, UV, X-rays, Gamma rays), applications",
            order: 2,
            isImportant: true,
          },
        ],
      },
      {
        name: "Optics",
        order: 16,
        topics: [
          {
            name: "Reflection of light, spherical mirrors, mirror formula",
            order: 1,
            isImportant: true,
          },
          {
            name: "Refraction at plane and spherical surfaces, thin lens formula, total internal reflection, magnification, power of lens",
            order: 2,
            isImportant: true,
          },
          {
            name: "Combination of thin lenses, refraction through prism, microscope and astronomical telescope",
            order: 3,
            isImportant: true,
          },
          {
            name: "Wave optics: wavefront, Huygens principle, interference (Young's double-slit), diffraction, polarization",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Dual Nature of Matter and Radiation",
        order: 17,
        topics: [
          {
            name: "Dual nature of radiation, Photoelectric effect, Einstein's photoelectric equation",
            order: 1,
            isImportant: true,
          },
          { name: "Matter waves, de Broglie relation", order: 2, isImportant: true },
        ],
      },
      {
        name: "Atoms and Nuclei",
        order: 18,
        topics: [
          {
            name: "Alpha-particle scattering, Rutherford's model, Bohr model, energy levels, hydrogen spectrum",
            order: 1,
            isImportant: true,
          },
          {
            name: "Composition and size of nucleus, mass-energy relation, mass defect, binding energy per nucleon",
            order: 2,
            isImportant: true,
          },
          { name: "Nuclear fission and fusion", order: 3, isImportant: true },
        ],
      },
      {
        name: "Electronic Devices",
        order: 19,
        topics: [
          {
            name: "Semiconductors, semiconductor diode, I-V characteristics, diode as rectifier",
            order: 1,
            isImportant: true,
          },
          {
            name: "LED, photodiode, solar cell, Zener diode as voltage regulator",
            order: 2,
            isImportant: true,
          },
          { name: "Logic gates (OR, AND, NOT, NAND, NOR)", order: 3, isImportant: true },
        ],
      },
      {
        name: "Experimental Skills",
        order: 20,
        topics: [
          {
            name: "Vernier calipers, screw gauge, simple pendulum, metre scale, Young's modulus, surface tension",
            order: 1,
            isImportant: false,
          },
          {
            name: "Viscosity, speed of sound, specific heat capacity, resistivity, metre bridge, Ohm's law",
            order: 2,
            isImportant: false,
          },
          {
            name: "Galvanometer, focal length of mirror and lens, prism, refractive index, p-n junction and Zener diode",
            order: 3,
            isImportant: false,
          },
        ],
      },
    ],
  },
  {
    name: "Chemistry",
    color: "#F59E0B",
    units: [
      {
        name: "Some Basic Concepts in Chemistry",
        order: 1,
        topics: [
          {
            name: "Matter and its nature, Dalton's atomic theory, atom, molecule, element and compound",
            order: 1,
            isImportant: true,
          },
          {
            name: "Laws of chemical combination, Atomic and molecular masses, mole concept, molar mass",
            order: 2,
            isImportant: true,
          },
          {
            name: "Percentage composition, empirical and molecular formulae, Chemical equations and stoichiometry",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Atomic Structure",
        order: 2,
        topics: [
          {
            name: "Nature of electromagnetic radiation, photoelectric effect, spectrum of hydrogen atom",
            order: 1,
            isImportant: true,
          },
          {
            name: "Bohr model of hydrogen atom, limitations, dual nature of matter, de Broglie, Heisenberg uncertainty",
            order: 2,
            isImportant: true,
          },
          {
            name: "Quantum mechanical model, atomic orbitals, quantum numbers, shapes of s, p and d orbitals",
            order: 3,
            isImportant: true,
          },
          {
            name: "Electron spin, Aufbau principle, Pauli's exclusion, Hund's rule, electronic configuration",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Chemical Bonding and Molecular Structure",
        order: 3,
        topics: [
          {
            name: "Kossel-Lewis approach, ionic and covalent bonds, ionic bonding, lattice enthalpy",
            order: 1,
            isImportant: true,
          },
          {
            name: "Electronegativity, Fajan's rule, dipole moment, VSEPR theory and shapes of simple molecules",
            order: 2,
            isImportant: true,
          },
          {
            name: "Valence bond theory, hybridization (s, p, d), resonance. Molecular Orbital Theory, LCAO, sigma and pi bonds",
            order: 3,
            isImportant: true,
          },
          {
            name: "Bond order, bond length and bond energy. Metallic bonding, hydrogen bonding",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Chemical Thermodynamics",
        order: 4,
        topics: [
          {
            name: "System and surroundings, extensive and intensive properties, state functions, entropy",
            order: 1,
            isImportant: true,
          },
          {
            name: "First law: work, heat, internal energy, enthalpy, heat capacity, Hess's law",
            order: 2,
            isImportant: true,
          },
          {
            name: "Enthalpies of bond dissociation, combustion, formation, atomization, hydration, ionization",
            order: 3,
            isImportant: true,
          },
          { name: "Second law, spontaneity, ΔG and equilibrium constant", order: 4, isImportant: true },
        ],
      },
      {
        name: "Solutions",
        order: 5,
        topics: [
          {
            name: "Concentration: molality, molarity, mole fraction, percentage",
            order: 1,
            isImportant: true,
          },
          {
            name: "Vapour pressure of solutions, Raoult's Law, ideal and non-ideal solutions",
            order: 2,
            isImportant: true,
          },
          {
            name: "Colligative properties, molecular mass from colligative properties, van't Hoff factor",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Equilibrium",
        order: 6,
        topics: [
          {
            name: "Concept of dynamic equilibrium. Physical and chemical equilibria, Henry's law",
            order: 1,
            isImportant: true,
          },
          {
            name: "Law of chemical equilibrium, Kp and Kc, ΔG and ΔG°, Le Chatelier's principle",
            order: 2,
            isImportant: true,
          },
          {
            name: "Ionic equilibrium: weak and strong electrolytes, acids and bases (Arrhenius, Bronsted-Lowry, Lewis)",
            order: 3,
            isImportant: true,
          },
          {
            name: "pH scale, common ion effect, hydrolysis of salts, solubility product, buffer solutions",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Redox Reactions and Electrochemistry",
        order: 7,
        topics: [
          {
            name: "Electronic concepts of oxidation and reduction, redox reactions, oxidation number, rules for assigning oxidation number and balancing of redox reactions.",
            order: 1,
            isImportant: true,
            class11: true,
            class12: false,
          },
          {
            name: "Electrolytic and metallic conduction, conductance in electrolytic solutions, molar conductivities and their variation with concentration, Kohlrausch's law and its applications. Electrochemical cells - Electrolytic and Galvanic cells, different types of electrodes, electrode potentials including standard electrode potential, half-cell and cell reactions, emf of a Galvanic cell and its measurement, Nernst equation and its applications, relationship between cell potential and Gibbs' energy change, dry cell and lead accumulator, fuel cells",
            order: 2,
            isImportant: true,
            class11: false,
            class12: true,
          },
        ],
      },
      {
        name: "Chemical Kinetics",
        order: 8,
        topics: [
          {
            name: "Rate of reaction, factors affecting rate (concentration, temperature, catalyst)",
            order: 1,
            isImportant: true,
          },
          {
            name: "Order and molecularity, rate law, rate constant, zero and first order reactions, half-lives",
            order: 2,
            isImportant: true,
          },
          {
            name: "Effect of temperature, Arrhenius theory, activation energy, collision theory",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Classification of Elements and Periodicity",
        order: 9,
        topics: [
          {
            name: "Modern periodic law, s, p, d and f block elements",
            order: 1,
            isImportant: true,
          },
          {
            name: "Periodic trends: atomic and ionic radii, ionization enthalpy, electron gain enthalpy, valence, chemical reactivity",
            order: 2,
            isImportant: true,
          },
        ],
      },
      {
        name: "p-Block Elements",
        order: 10,
        topics: [
          {
            name: "General Introduction: Electronic configuration and general trends in physical and chemical properties of elements across the periods and down the groups, unique behaviour of the first element in each group.",
            order: 1,
            isImportant: true,
            class11: true,
            class12: false,
          },
          {
            name: "General Introduction: Electronic configuration and general trends in physical and chemical properties of elements across the periods and down the groups, unique behaviour of the first element in each group.",
            order: 2,
            isImportant: true,
            class11: false,
            class12: true,
          },
        ],
      },
      {
        name: "d- and f-Block Elements",
        order: 11,
        topics: [
          {
            name: "Transition elements: electronic configuration, occurrence, general trends in first-row transition elements",
            order: 1,
            isImportant: true,
          },
          {
            name: "Physical properties, ionization enthalpy, oxidation states, colour, catalysis, magnetic properties, complex formation",
            order: 2,
            isImportant: true,
          },
          {
            name: "K2Cr2O7 and KMnO4. Lanthanoids and Actinoids",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Coordination Compounds",
        order: 12,
        topics: [
          {
            name: "Introduction, Werner's theory, ligands, coordination number, denticity, chelation",
            order: 1,
            isImportant: true,
          },
          {
            name: "IUPAC nomenclature, isomerism, Valence bond approach, Crystal field theory, colour and magnetic properties",
            order: 2,
            isImportant: true,
          },
        ],
      },
      {
        name: "Purification and Characterisation of Organic Compounds",
        order: 13,
        topics: [
          {
            name: "Purification: Crystallization, sublimation, distillation, chromatography",
            order: 1,
            isImportant: true,
          },
          {
            name: "Qualitative analysis: Detection of N, S, P, halogens. Quantitative analysis: C, H, N, halogens, S, P",
            order: 2,
            isImportant: true,
          },
        ],
      },
      {
        name: "Some Basic Principles of Organic Chemistry",
        order: 14,
        topics: [
          {
            name: "Tetravalency of carbon, shapes of simple molecules, hybridization, classification by functional groups",
            order: 1,
            isImportant: true,
          },
          {
            name: "Homologous series, isomerism (structural and stereoisomerism), Nomenclature (Trivial and IUPAC)",
            order: 2,
            isImportant: true,
          },
          {
            name: "Covalent bond fission: homolytic and heterolytic, carbocations, carbanions, electrophiles and nucleophiles",
            order: 3,
            isImportant: true,
          },
          {
            name: "Inductive effect, electromeric effect, resonance, hyperconjugation. Substitution, addition, elimination, rearrangement",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Hydrocarbons",
        order: 15,
        topics: [
          {
            name: "Classification, isomerism, IUPAC nomenclature, preparation, properties and reactions",
            order: 1,
            isImportant: true,
          },
          {
            name: "Alkanes: Conformations, mechanism of halogenation",
            order: 2,
            isImportant: true,
          },
          {
            name: "Alkenes: Geometrical isomerism, electrophilic addition, Markownikoff and peroxide effect, Ozonolysis",
            order: 3,
            isImportant: true,
          },
          {
            name: "Alkynes: Acidic character, addition reactions. Aromatic hydrocarbons: Benzene structure, electrophilic substitution",
            order: 4,
            isImportant: true,
          },
        ],
      },
      {
        name: "Organic Compounds Containing Halogens",
        order: 16,
        topics: [
          {
            name: "Preparation, properties and reactions, nature of C-X bond, mechanisms of substitution",
            order: 1,
            isImportant: true,
          },
          {
            name: "Uses and environmental effects of chloroform, iodoform, freons, DDT",
            order: 2,
            isImportant: false,
          },
        ],
      },
      {
        name: "Organic Compounds Containing Oxygen",
        order: 17,
        topics: [
          {
            name: "Alcohols, phenols, ethers: preparation, properties, reactions, uses",
            order: 1,
            isImportant: true,
          },
          {
            name: "Aldehydes and ketones: carbonyl group, nucleophilic addition, Grignard, oxidation, reduction, aldol, Cannizzaro",
            order: 2,
            isImportant: true,
          },
          {
            name: "Carboxylic acids: acidic strength and factors affecting it",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Organic Compounds Containing Nitrogen",
        order: 18,
        topics: [
          {
            name: "Amines: nomenclature, classification, structure, basic character, identification of primary, secondary, tertiary amines",
            order: 1,
            isImportant: true,
          },
          {
            name: "Diazonium salts: importance in synthetic organic chemistry",
            order: 2,
            isImportant: true,
          },
        ],
      },
      {
        name: "Biomolecules",
        order: 19,
        topics: [
          {
            name: "Carbohydrates: Classification, aldoses and ketoses, glucose, fructose, sucrose, lactose, maltose",
            order: 1,
            isImportant: true,
          },
          {
            name: "Proteins: α-amino acids, peptide bond, primary, secondary, tertiary, quaternary structure, denaturation, enzymes",
            order: 2,
            isImportant: true,
          },
          {
            name: "Vitamins: Classification and functions. Nucleic acids: DNA and RNA, biological functions. Hormones",
            order: 3,
            isImportant: true,
          },
        ],
      },
      {
        name: "Principles Related to Practical Chemistry",
        order: 20,
        topics: [
          {
            name: "Detection of elements and functional groups in organic compounds",
            order: 1,
            isImportant: false,
          },
          {
            name: "Preparation of inorganic and organic compounds, titrimetric exercises, qualitative salt analysis",
            order: 2,
            isImportant: false,
          },
        ],
      },
    ],
  },
];

function expandSyllabus(): SubjectSeed[] {
  return RAW_SYLLABUS.map((subject) => ({
    name: subject.name,
    color: subject.color,
    units: subject.units.map((unit) => ({
      name: unit.name,
      order: unit.order,
      topics: expandUnitTopics(subject.name, unit.order, unit.topics),
    })),
  }));
}

export const JEE_MAIN_SYLLABUS: SubjectSeed[] = expandSyllabus();

const HAS_TOUCH = 'ontouchstart' in document.documentElement;

const r = (max) => Math.floor(Math.random() * max);
const images = ["charlie_chaplin.jpg", "rubinshtein.jpg", "script.jpg"];
const getImage = () => `assets/${images[r(images.length)]}`;
const geometries = ["shard", "warped_glass_3"];
const getGeomety = () => geometries[r(geometries.length)];
const img = location.hash.substr(1);

class Refraction {
  /**
   * @param {string} effect {'reflection'|'refraction'}
   */
  constructor(effect) {
    this.deferredLoadEventName = "refraction-load-complete";
    this.defaults = {
      image: img || getImage(),
      reflection_type: effect,
      flip: false,
      refraction_ratio: 11,
      mouse_interaction: !0,
      mouse_speed: 63,
      refract_interaction: !1,
      refract_motion: "speed",
      geometry: img ? "warped_glass_3" : getGeomety(),
      zoom: 169,
      rot_x: 145,
      rot_y: 195,
      rot_z: 115,
      rot_speed_x: 3.5,
      rot_speed_y: -1.5,
      rot_speed_z: 2,
      color: "rgba(255,255,255,1)",
      rgb: "rgb(255,255,255)",
      color_r: "255",
      color_g: "255",
      color_b: "255",
      alpha: "1",
      overlay_type: "multiply_color",
    };
    this.model = {
      ...this.defaults,
      reflection_type: this.defaults.geometry === 'shard' ? 'reflection' : 'refraction',
      flip: this.defaults.geometry === 'shard',
    };
    this.image_load_queue = [];
    this.data = {
      is_running: !1,
      counter: 0,
      dimensions: {
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        resolution: 1,
        aspect: 1.33,
        inverse_aspect: .75
      },
      image_dimensions: {
        width: 800,
        height: 600,
        aspect: 1.33,
        inverse_aspect: .75
      },
      mouse: {
        prev: {
          x: 0,
          y: 0,
          vector_length: 0
        },
        current: {
          x: 0,
          y: 0,
          vector_length: 0
        },
        smoothed_vector_array: [0, 0, 0, 0, 0],
        inited: !1
      },
      inited: !1,
      init_start: !1,
      image_loaded: !1,
      object_loaded: !1,
    };
    this.three_data = {};
    this.cube_data = {};
    this.drawFrameID = null;
    this.mouseCallback = e => this.updateMouseInput(e);
    this.el = document.getElementById('root');
  }

  makeMaterial() {
    if (this.data.inited) {
      this.model.flip
        ? (this.cube_data.cube.material[0].map.flipY = !1,
          this.cube_data.cube.material[1].map.flipY = !1,
          this.cube_data.cube.material[2].map.flipY = !1,
          this.cube_data.cube.material[3].map.flipY = !1,
          this.cube_data.cube.material[4].map.flipY = !1,
          "refraction" == this.model.reflection_type
            ? this.cube_data.plane.material.map.flipY = !1
            : this.cube_data.plane.material.map.flipY = !0)
        : (this.cube_data.cube.material[0].map.flipY = !0,
          this.cube_data.cube.material[1].map.flipY = !0,
          this.cube_data.cube.material[2].map.flipY = !0,
          this.cube_data.cube.material[3].map.flipY = !0,
          this.cube_data.cube.material[4].map.flipY = !0,
          "refraction" == this.model.reflection_type
            ? this.cube_data.plane.material.map.flipY = !0
            : this.cube_data.plane.material.map.flipY = !1),

      this.cube_data.cube.material[0].map.needsUpdate = !0,
      this.cube_data.cube.material[1].map.needsUpdate = !0,
      this.cube_data.cube.material[2].map.needsUpdate = !0,
      this.cube_data.cube.material[3].map.needsUpdate = !0,
      this.cube_data.cube.material[4].map.needsUpdate = !0,
      this.cube_data.plane.material.map.needsUpdate = !0,

      "reflection" == this.model.reflection_type
        ? (this.cube_data.cube_camera.renderTarget.mapping = THREE.CubeReflectionMapping,
          this.cube_data.cube.rotation.x = 0,
          this.cube_data.cube.rotation.y = Math.PI,
          this.cube_data.cube.rotation.z = 0,
          this.cube_data.plane.rotation.x = 0,
          this.cube_data.plane.rotation.y = Math.PI,
          this.cube_data.plane.rotation.z = 0,
          this.cube_data.plane.position.z = .5)
        : (this.cube_data.cube_camera.renderTarget.mapping = THREE.CubeRefractionMapping,
          this.cube_data.cube_camera.renderTarget.texture.repeat.y = 1,
          this.cube_data.cube.rotation.x = 0,
          this.cube_data.cube.rotation.z = 0,
          this.cube_data.cube.rotation.y = 0,
          this.cube_data.plane.rotation.x = 0,
          this.cube_data.plane.rotation.y = 0,
          this.cube_data.plane.position.z = -.5),
      this.data.cubemap_needs_update = !0,
      this.three_data.render_object.material.envMap = this.cube_data.cube_camera.renderTarget,
      this.three_data.render_object.material.needsUpdate = !0
    }
  }

  setUpScene() {
    this.updateWindow(!0),
    this.three_data.max_refraction_ratio = 1 - this.model.refraction_ratio / 100,
    this.three_data.renderer.domElement.id = "three_canvas",
    this.three_data.renderer.setPixelRatio(window.devicePixelRatio),
    this.updateWindow(!0),
    this.three_data.renderer.sortObjects = !1,
    this.el.appendChild(this.three_data.renderer.domElement);
    var e = [new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.BackSide
    }), new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.BackSide
    }), new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.BackSide
    }), new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.BackSide
    }), new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.BackSide
    }), new THREE.MeshBasicMaterial({})];
    this.cube_data.cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshFaceMaterial(e)),
    this.cube_data.plane = new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1),new THREE.MeshBasicMaterial({
        map: this.cube_data.cube_texture,
        side: THREE.FrontSide
    })),
    this.cube_data.cube.position.z = 0,
    this.cube_data.scene.add(this.cube_data.cube),
    this.cube_data.plane.position.z = -.5,
    this.cube_data.scene.add(this.cube_data.plane),
    this.cube_data.cube_camera.renderTarget.texture.minFilter = THREE.LinearFilter,
    this.cube_data.cube_camera.renderTarget.texture.magFilter = THREE.LinearFilter,
    this.cube_data.scene.add(this.cube_data.cube_camera),
    this.three_data.camera.position.z = .2,
    this.data.inited = !0,
    this.makeMaterial(),
    this.three_data.parent_object.position.z = 0,
    this.three_data.parent_object.add(this.three_data.render_object),
    this.three_data.scene.add(this.three_data.parent_object),
    this.cube_data.cube_camera.updateCubeMap(this.three_data.renderer, this.cube_data.scene),
    this.updateWindow(!0),
    this.draw();
  }

  getOverlayType() {
    switch(this.model.overlay_type) {
      case "normal_color":
        return THREE.MixOperation;
      case "multiply_color":
        return THREE.MultiplyOperation;
      case "screen_color":
        return THREE.AddOperation;
      default:
        return THREE.MixOperation;
    }
  }

  loadObj() {
    const geom = "assets/" + this.model.geometry + ".obj";
    const r = this;
    this.three_data.obj_loader.load(geom, e => {
      e.traverse(function(e) {
        void 0 !== e.geometry && (r.data.object_loaded = !0,
        r.three_data.render_object && r.three_data.parent_object.remove(r.three_data.render_object),
        r.three_data.render_object = new THREE.Mesh(e.geometry,new THREE.MeshPhongMaterial({
            color: new THREE.Color(16777215),
            emissive: new THREE.Color(r.model.rgb),
            combine: r.getOverlayType(),
            side: THREE.FrontSide,
            refractionRatio: r.three_data.max_refraction_ratio,
            envMap: r.cube_data.cube_camera.renderTarget
        })),
        r.three_data.render_object.scale.x = 50,
        r.three_data.render_object.scale.y = 50,
        r.three_data.render_object.scale.z = 50,
        r.three_data.parent_object.add(r.three_data.render_object),
        1 == r.data.image_loaded && 0 == r.data.init_start && (r.data.init_start = !0,
        r.setUpScene()))
      }),
      r.Resume()
    });
  }

  loadImage() {
    var e = this
      , t = this.model.image
      , r = this.model.image
      , i = new Image;
    i.crossOrigin = "";
    var n, o, a;
    this.data.image_loaded = !1,
    this.image_load_queue.push({
      url: t,
      width: null,
      height: null
    }),
    i.onload = function() {
        var r, s, h = e.image_load_queue.pop();
        return e.model.image != h.url && e.model.image != h.url ? void e.loadImage() : void (h.url == t && (h.width && h.height ? e.data.image_dimensions = {
            width: h.width,
            height: h.height,
            aspect: h.width / h.height,
            inverse_aspect: h.height / h.width
        } : e.data.image_dimensions = {
            width: i.width,
            height: i.height,
            aspect: i.width / i.height,
            inverse_aspect: i.height / i.width
        },
        e.isPowerOfTwo(i.width) && e.isPowerOfTwo(i.height)
            ? a = i
            : (n = document.createElement("canvas"),
              o = n.getContext("2d"),
              r = n.width = e.nextHighestPowerOfTwo(e.data.image_dimensions.width),
              s = n.height = e.nextHighestPowerOfTwo(e.data.image_dimensions.height),
              o.drawImage(i, 0, 0, i.width, i.height, 0, 0, n.width, n.height),
              a = n),
        e.cube_data.cube_texture.image = a,
        e.cube_data.cube_texture.needsUpdate = !0,
        e.updateWindow(!0),
        e.data.image_loaded = !0,
        1 == e.data.object_loaded && 0 == e.data.init_start
            ? (e.data.init_start = !0,
              e.setUpScene(),
              e.Resume())
            : e.data.object_loaded && (e.makeMaterial(),
              e.Resume())))
    }
    ,
    i.src = r
  }

  isPowerOfTwo(e) {
    return 0 == (e & e - 1)
  }

  nextHighestPowerOfTwo(e) {
    --e;
    for (var t = 1; 32 > t; t <<= 1)
        e |= e >> t;
    return Math.min(e + 1, 1024)
  }

  updateWindow(e) {
    var t, r, i, n, o, a = document.getElementById("backdrop");
    if (null !== a
        && (t = a.offsetWidth + 1,
            r = a.offsetHeight + 1,
            i = a.offsetLeft,
            n = a.offsetTop,
            o = window.devicePixelRatio,
            this.data.dimensions.width != t
                || this.data.dimensions.height != r
                || 1 == e
                || this.data.dimensions.resolution != o)
    ) {
      this.data.dimensions = {
        left: i,
        top: n,
        width: t,
        resolution: o,
        height: r,
        aspect: t / r,
        inverse_aspect: r / t
      },
      this.three_data.renderer.setPixelRatio(o),
      this.three_data.renderer.setSize(t, r);
      var s = this.data.dimensions.aspect / this.data.image_dimensions.aspect
        , h = (this.model.zoom - 100) / 400
        , c = .09 * (4 * -Math.pow(h + -.5, 2) + 1) + .91;
      if (this.cube_data.cube) {
        this.data.image_dimensions.aspect > 1
          ? this.data.image_dimensions.aspect > this.data.dimensions.aspect
              ? (this.cube_data.cube.scale.x = this.data.image_dimensions.aspect,
                this.cube_data.cube.scale.y = 1,
                this.cube_data.cube.scale.z = 1,
                this.cube_data.plane.scale.x = this.data.image_dimensions.aspect,
                this.cube_data.plane.scale.y = 1)
              : (this.cube_data.cube.scale.x = this.data.image_dimensions.aspect * s,
                this.cube_data.cube.scale.y = s,
                this.cube_data.cube.scale.z = 1,
                this.cube_data.plane.scale.x = this.data.image_dimensions.aspect * s,
                this.cube_data.plane.scale.y = s)
          : this.data.image_dimensions.aspect > this.data.dimensions.aspect
              ? (this.cube_data.cube.scale.x = 1,
                this.cube_data.cube.scale.y = this.data.image_dimensions.inverse_aspect,
                this.cube_data.cube.scale.z = 1,
                this.cube_data.plane.scale.x = 1,
                this.cube_data.plane.scale.y = this.data.image_dimensions.inverse_aspect)
              : (this.cube_data.cube.scale.x = this.data.image_dimensions.aspect * s,
                this.cube_data.cube.scale.y = s,
                this.cube_data.cube.scale.z = 1,
                this.cube_data.plane.scale.x = this.data.image_dimensions.aspect * s,
                this.cube_data.plane.scale.y = s),
        this.cube_data.cube.scale.x *= (1 - h) * c + (1 - c),
        this.cube_data.cube.scale.y *= (1 - h) * c + (1 - c),
        this.cube_data.plane.scale.x *= (1 - h) * c + (1 - c),
        this.cube_data.plane.scale.y *= (1 - h) * c + (1 - c),
        this.data.cubemap_needs_update = !0
      }
      this.data.dimensions.aspect > 1
          ? this.three_data.camera.aspect = this.data.dimensions.aspect
          : this.three_data.camera.aspect = this.data.dimensions.aspect,
      this.three_data.camera.fov = 90 - 80 * h,
      this.three_data.camera.updateProjectionMatrix()
    }
  }

  Pause() {
      window.cancelAnimationFrame(this.drawFrameID),
      this.data.is_running = !1
  }

  Resume() {
      !this.data.is_running && this.data.inited && this.draw()
  }

  draw() {
      this.data.is_running = !0;
      var e = this
        , t = 0
        , r = .1 * this.model.mouse_speed;
      this.drawFrameID = window.requestAnimationFrame(_ => this.draw());
      this.updateWindow(),
      this.data.counter++,
      this.data.counter > -1 && (t = e.data.counter),
      this.updateMouseMovement(),
      this.three_data.camera.position.x = this.data.mouse.prev.x * r * .3,
      this.three_data.camera.position.y = -this.data.mouse.prev.y * r * .3,
      this.three_data.parent_object.rotation.x = this.data.mouse.prev.y * -.05 * r,
      this.three_data.parent_object.rotation.y = this.data.mouse.prev.x * -.05 * r,
      this.three_data.render_object.rotation.x = 289e-6 * this.model.rot_speed_x * t + .01745 * this.model.rot_x,
      this.three_data.render_object.rotation.y = 289e-6 * this.model.rot_speed_y * t + .01745 * this.model.rot_y,
      this.three_data.render_object.rotation.z = 289e-6 * this.model.rot_speed_z * t + .01745 * this.model.rot_z;

      if ("refraction" == this.model.reflection_type) {
        this.three_data.render_object.material.refractionRatio =
            this.model.refract_interaction &&
            this.model.mouse_interaction
                ? this.three_data.render_object.material.refractionRatio = 1 - (1 - this.three_data.max_refraction_ratio) * e.data.mouse.smoothed_vector
                : this.three_data.render_object.material.refractionRatio = 1 - (1 - this.three_data.max_refraction_ratio);
      }

      1 == this.data.cubemap_needs_update
          && (this.cube_data.cube_camera.updateCubeMap(this.three_data.renderer, this.cube_data.scene),
              this.data.cubemap_needs_update = !1),
      this.three_data.renderer.render(this.three_data.scene, this.three_data.camera)
  }

  updateMouseInput(e) {
      var t = this.model.refract_motion
        , r = this.model.reflection_type
        , i = 0
        , n = 0;
      if ("speed" == t && "refraction" == r) {
        i = this.data.mouse.prev.x;
        n = this.data.mouse.prev.y;
      }
      var o, a;
      HAS_TOUCH
          ? (o = e.touches[0].clientX,
            a = e.touches[0].clientY)
          : (o = e.clientX,
            a = e.clientY),
      o = o / (this.data.dimensions.left + this.data.dimensions.width) * 2 - 1,
      a = a / (this.data.dimensions.top + this.data.dimensions.height) * 2 - 1,
      this.data.mouse.current.vector_length = Math.sqrt(Math.pow(o - i, 2) + Math.pow(a - n, 2)),
      this.data.mouse.current.x = o,
      this.data.mouse.current.y = a;
      const vector_length = this.data.mouse.current.vector_length;
      switch (t) {
        case "gather":
          this.data.mouse.current.vector_length = Math.max(Math.min(2 * Math.sqrt(vector_length) - 1, 1), 0);
          break;
        case "disperse":
          this.data.mouse.current.vector_length = 1 - Math.max(Math.min(2 * Math.sqrt(vector_length) - 1, 1), 0);
          break;
        case "speed":
          if (1.2 * vector_length > this.data.mouse.prev.vector_length) {
            this.data.mouse.prev.vector_length = Math.min(1.2 * vector_length, 1);
          }
          break;
      }
  }

  updateMouseMovement() {
    if (0 == this.model.mouse_interaction) {
      return void (this.data.mouse = {
          prev: {
              x: 0,
              y: 0,
              vector_length: 0
          },
          current: {
              x: 0,
              y: 0,
              vector_length: 0
          },
          smoothed_vector: 0,
          smoothed_vector_array: [0, 0, 0, 0, 0],
          inited: !1
      });
    }
    var e = 0;
    if (0 == this.data.mouse.inited)
        this.data.mouse.prev = this.data.mouse.current,
        this.data.mouse.inited = !0;
    else {
        var t = {
            x: .9 * this.data.mouse.prev.x + .1 * this.data.mouse.current.x,
            y: .9 * this.data.mouse.prev.y + .1 * this.data.mouse.current.y
        };
        if ("speed" == this.model.refract_motion) {
            this.data.mouse.smoothed_vector_array.unshift(this.data.mouse.prev.vector_length);
            for (var r = 0; r < this.data.mouse.smoothed_vector_array.length; r++)
                e += this.data.mouse.smoothed_vector_array[r];
            this.data.mouse.smoothed_vector_array.length > 5 && (this.data.mouse.smoothed_vector_array = this.data.mouse.smoothed_vector_array.splice(0, 5)),
            this.data.mouse.smoothed_vector = e / 5,
            t.vector_length = .95 * this.data.mouse.prev.vector_length
        } else
            t.vector_length = .05 * this.data.mouse.current.vector_length + .95 * this.data.mouse.prev.vector_length,
            this.data.mouse.smoothed_vector = t.vector_length;
        this.data.mouse.prev = t
    }
  }

  Init() {
    this.three_data = {
        renderer: window.devicePixelRatio > 1 ? new THREE.WebGLRenderer : new THREE.WebGLRenderer({
            antialias: !0
        }),
        scene: new THREE.Scene,
        parent_object: new THREE.Group,
        camera: new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight,.01,1e3),
        manager: new THREE.LoadingManager,
        max_refraction_ratio: .5,
        obj_loader: null,
        image_loader: null,
        render_object: null
    };
    var e = this.three_data.renderer.context.getParameter(this.three_data.renderer.context.MAX_CUBE_MAP_TEXTURE_SIZE);
    e = 1024 > e
        ? 512
        : 2048 > e
            ? 1024
            : 2048,
    this.cube_data = {
        scene: new THREE.Scene,
        camera: new THREE.PerspectiveCamera(90,1,.1,1e3),
        cube_texture: new THREE.Texture,
        cube_camera: new THREE.CubeCamera(.1,1e3,e),
        cube: null,
        plane: null
    },
    this.data.inited = !1,
    this.data.init_start = !1,
    this.data.image_loaded = !1,
    this.data.object_loaded = !1,
    HAS_TOUCH
      ? window.addEventListener("touchmove", this.mouseCallback)
      : window.addEventListener("mousemove", this.mouseCallback),
    this.three_data.obj_loader = new THREE.OBJLoader(this.three_data.manager),
    this.three_data.image_loader = new THREE.ImageLoader(this.three_data.manager),
    this.three_data.image_loader.crossOrigin = "",
    this.loadImage(),
    this.loadObj()
  }

  Update(e, t) {
    if (t != this.model[e] || "geometry" == e) {
      this.model[e] = t;
      if ("rot_speed_x" == e || "rot_speed_y" == e || "rot_speed_z" == e) {
        this.data.counter = -6;
      }
      switch(e) {
        case "image":
          this.loadImage();
          break;
        case "zoom":
          this.updateWindow(!0);
          break;
        case "geometry":
          this.loadObj();
          break;
        case "reflection_type":
          this.makeMaterial();
          this.updateWindow(!0);
          break;
        case "flip":
          this.makeMaterial();
          this.updateWindow(!0);
          break;
        case "refraction_ratio":
          if (this.three_data.render_object) {
            this.three_data.max_refraction_ratio = 1 - t / 100;
          }
          break;
        case "rgb":
          if (this.three_data.render_object) {
            this.three_data.render_object.material.emissive = new THREE.Color(t);
          }
          break;
        case "overlay_type":
          if (this.three_data.render_object) {
            this.three_data.render_object.material.combine = this.getOverlayType();
            this.three_data.render_object.material.needsUpdate = !0;
          }
          break;
      }
    }
  }

  destroy() {
    this.image_load_queue = [],
    window.cancelAnimationFrame(this.drawFrameID),
    this.data.inited = !1,
    this.data.init_start = !1,
    this.data.image_loaded = !1,
    this.data.object_loaded = !1,
    window.removeEventListener("mousemove", this.mouseCallback, !1),
    window.removeEventListener("touchmove", this.mouseCallback, !1),
    this.three_data.scene = null,
    this.cube_data.scene = null,
    this.data = null,
    this.three_data = null,
    this.cube_data = null
  }
}

const refraction = new Refraction('reflection');
refraction.Init();

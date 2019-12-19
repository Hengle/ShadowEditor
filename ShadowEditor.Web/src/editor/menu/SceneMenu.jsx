import { MenuItem, MenuItemSeparator } from '../../third_party';
import Converter from '../../serialization/Converter';
import Ajax from '../../utils/Ajax';
import GISScene from '../../gis/Scene';
import TimeUtils from '../../utils/TimeUtils';
import StringUtils from '../../utils/StringUtils';

/**
 * 场景菜单
 * @author tengge / https://github.com/tengge1
 */
class SceneMenu extends React.Component {
    constructor(props) {
        super(props);

        this.handleCreateEmptyScene = this.handleCreateEmptyScene.bind(this);
        this.handleCreateGISScene = this.handleCreateGISScene.bind(this);
        this.handleSaveScene = this.handleSaveScene.bind(this);
        this.handleSaveAsScene = this.handleSaveAsScene.bind(this);

        this.handleExportSceneToJson = this.handleExportSceneToJson.bind(this);
        this.handleExportSceneToCollada = this.handleExportSceneToCollada.bind(this);
        this.handleExportSceneToGltf = this.handleExportSceneToGltf.bind(this);
        this.handleExportSceneToOBJ = this.handleExportSceneToOBJ.bind(this);
        this.handleExportSceneToPLY = this.handleExportSceneToPLY.bind(this);

        this.handlePublishScene = this.handlePublishScene.bind(this);
    }

    render() {
        const { enableAuthority, isLogin, authorities, isAdmin } = app.server;

        return <MenuItem title={_t('Scene')}>
            {!enableAuthority || isLogin ? <MenuItem title={_t('New')}>
                <MenuItem title={_t('Empty Scene')}
                    onClick={this.handleCreateEmptyScene}
                />
                <MenuItem title={_t('GIS Scene')}
                    onClick={this.handleCreateGISScene}
                />
            </MenuItem> : null}
            {!enableAuthority || authorities.includes('SAVE_SCENE') ? <MenuItem title={_t('Save')}
                onClick={this.handleSaveScene}
                                                                      /> : null}
            {!enableAuthority || authorities.includes('SAVE_SCENE') ? <MenuItem title={_t('Save As')}
                onClick={this.handleSaveAsScene}
                                                                      /> : null}
            {!enableAuthority || authorities.includes('SAVE_SCENE') ? <MenuItemSeparator /> : null}
            {!enableAuthority || isLogin ? <MenuItem title={_t('Export Scene')}>
                <MenuItem title={_t('To JSON File')}
                    onClick={this.handleExportSceneToJson}
                />
                <MenuItem title={_t('To Collada File')}
                    onClick={this.handleExportSceneToCollada}
                />
                <MenuItem title={_t('To GLTF File')}
                    onClick={this.handleExportSceneToGltf}
                />
                <MenuItem title={_t('To OBJ File')}
                    onClick={this.handleExportSceneToOBJ}
                />
                <MenuItem title={_t('To PLY File')}
                    onClick={this.handleExportSceneToPLY}
                />
            </MenuItem> : null}
            {!enableAuthority || isAdmin ? <MenuItem title={_t('Publish Scene')}
                onClick={this.handlePublishScene}
                                           /> : null}
        </MenuItem>;
    }

    // ---------------------------- 新建空场景 ---------------------------------

    handleCreateEmptyScene() {
        var editor = app.editor;

        if (editor.sceneID === null) {
            editor.clear();
            editor.sceneID = null;
            editor.sceneName = null;
            document.title = _t('No Name');
            app.toast(_t('Create empty scene successfully.'), 'success');
            return;
        }

        app.confirm({
            title: _t('Confirm'),
            content: _t('All unsaved data will be lost. Are you sure?'),
            onOK: () => {
                editor.clear();
                editor.sceneID = null;
                editor.sceneName = null;
                app.options.sceneType = 'Empty';
                document.title = _t('No Name');
                app.editor.camera.userData.control = 'OrbitControls';
            }
        });
    }

    // --------------------------- 新建GIS场景 -------------------------------------

    handleCreateGISScene() {
        if (app.editor.gis) {
            app.editor.gis.stop();
        }

        app.editor.gis = new GISScene(app);
        app.editor.gis.start();

        app.options.sceneType = 'GIS';

        app.editor.camera.userData.control = '';

        app.call(`sceneGraphChanged`, this);
    }

    // --------------------------- 保存场景 ----------------------------------------

    handleSaveScene() { // 保存场景
        var editor = app.editor;
        var id = editor.sceneID;
        var sceneName = editor.sceneName;

        if (id) { // 编辑场景
            this.commitSave(id, sceneName);
        } else { // 新建场景
            app.prompt({
                title: _t('Save Scene'),
                content: _t('Name'),
                value: _t('New Scene'),
                onOK: name => {
                    this.commitSave(id, name);
                }
            });
        }
    }

    commitSave(id, sceneName) {
        var editor = app.editor;

        // 记录选中物体，以便载入时还原场景选中
        var selected = app.editor.selected;
        if (selected) {
            app.options.selected = selected.uuid;
        }

        app.mask(_t('Waiting...'));

        var obj = new Converter().toJSON({
            options: app.options,
            camera: editor.camera,
            renderer: editor.renderer,
            scripts: editor.scripts,
            animations: editor.animations,
            scene: editor.scene,
            visual: editor.visual
        });

        var params = {
            Name: sceneName,
            Data: JSON.stringify(obj)
        };

        if (id) {
            params.ID = id;
        }

        Ajax.post(`${app.options.server}/api/Scene/Save`, params, result => {
            var obj = JSON.parse(result);

            if (obj.Code === 200) {
                editor.sceneID = obj.ID;
                editor.sceneName = sceneName;
                document.title = sceneName;
            }

            app.call(`sceneSaved`, this);

            app.unmask();

            app.toast(_t(obj.Msg), 'success');
        });
    }

    // --------------------------- 另存为场景 -------------------------------------

    handleSaveAsScene() {
        var sceneName = app.editor.sceneName;

        if (sceneName === null) {
            sceneName = _t('New Scene');
        }

        app.prompt({
            title: _t('Save Scene'),
            content: _t('Name'),
            value: sceneName,
            onOK: name => {
                app.editor.sceneName = name;
                document.title = name;
                this.commitSaveAs(name);
            }
        });
    }

    commitSaveAs(sceneName) {
        var editor = app.editor;

        app.mask(_t('Waiting...'));

        var obj = new Converter().toJSON({
            options: app.options,
            camera: editor.camera,
            renderer: editor.renderer,
            scripts: editor.scripts,
            animations: editor.animations,
            scene: editor.scene,
            visual: editor.visual
        });

        Ajax.post(`${app.options.server}/api/Scene/Save`, {
            Name: sceneName,
            Data: JSON.stringify(obj)
        }, result => {
            var obj = JSON.parse(result);

            if (obj.Code === 200) {
                editor.sceneID = obj.ID;
                editor.sceneName = sceneName;
                document.title = sceneName;
            }

            app.call(`sceneSaved`, this);

            app.unmask();

            app.toast(_t(obj.Msg), 'success');
        });
    }

    // ---------------------- 导出场景为json文件 --------------------------

    querySceneName() {
        var sceneName = app.editor.sceneName;

        if (!sceneName) {
            sceneName = _t(`Scene{{Time}}`, { Time: TimeUtils.getDateTime() });
        }

        return new Promise(resolve => {
            app.prompt({
                title: _t('Input File Name'),
                content: _t('Name'),
                value: sceneName,
                onOK: name => {
                    resolve(name);
                }
            });
        });
    }

    handleExportSceneToJson() {
        this.querySceneName().then(name => {
            var output = app.editor.scene.toJSON();

            try {
                output = JSON.stringify(output, StringUtils.parseNumber, '\t');
                // eslint-disable-next-line
                output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
            } catch (e) {
                output = JSON.stringify(output);
            }
    
            StringUtils.saveString(output, `${name}.json`);
        });
    }

    // ----------------------- 导出场景为Collada文件 ----------------------

    handleExportSceneToCollada() {
        this.querySceneName().then(name => {
            app.require('ColladaExporter').then(() => {
                var exporter = new THREE.ColladaExporter();

                exporter.parse(app.editor.scene, function (result) {
                    StringUtils.saveString(result.data, `${name}.dae`);
                });
            });
        });
    }

    // ----------------------- 导出场景为gltf文件 -------------------------

    handleExportSceneToGltf() {
        this.querySceneName().then(name => {
            app.require('GLTFExporter').then(() => {
                var exporter = new THREE.GLTFExporter();
    
                exporter.parse(app.editor.scene, result => {
                    StringUtils.saveString(JSON.stringify(result), `${name}.gltf`);
                });
            });
        });
    }

    // ---------------------- 导出场景为OBJ文件 -------------------------------

    handleExportSceneToOBJ() {
        this.querySceneName().then(name => {
            app.require('OBJExporter').then(() => {
                var exporter = new THREE.OBJExporter();
                StringUtils.saveString(exporter.parse(app.editor.scene), `${name}.obj`);
            });
        });
    }

    // ----------------------- 导出场景为PLY文件 ---------------------------------

    handleExportSceneToPLY() {
        this.querySceneName().then(name => {
            app.require('PLYExporter').then(() => {
                var exporter = new THREE.PLYExporter();
                StringUtils.saveString(exporter.parse(app.editor.scene, {
                    excludeAttributes: ['normal', 'uv', 'color', 'index']
                }), `${name}.ply`);
            });
        });
    }

    // -------------------------- 发布场景 --------------------------------

    handlePublishScene() {
        var sceneID = app.editor.sceneID;

        if (!sceneID) {
            app.toast(_t('Please open scene first.'), 'warn');
            return;
        }

        app.confirm({
            title: _t('Query'),
            content: _t('Are you sure to export the current scene?'),
            onOK: () => {
                app.mask(_t('Exporting...'));

                fetch(`${app.options.server}/api/ExportScene/Run?ID=${sceneID}`, {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        response.json().then(obj => {
                            app.unmask();
                            if (obj.Code !== 200) {
                                app.toast(_t(obj.Msg), 'warn');
                                return;
                            }
                            app.toast(_t(obj.Msg), 'success');
                            window.open(`${app.options.server}${obj.Url}`, 'export');
                        });
                    }
                });
            }
        });
    }
}

export default SceneMenu;
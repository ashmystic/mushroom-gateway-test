import * as THREE from 'three';

/**
 * Loads the mushroom gateway OBJ/MTL model and adds it to the scene, along with the portal mesh.
 * @param {object} params - { scene, mtlLoader, objLoader, textureLoader, getTerrainHeight, portalMaterial, onLoaded }
 */
export function loadGatewayModel({
    scene,
    mtlLoader,
    objLoader,
    getTerrainHeight,
    portalMaterial,
    onLoaded
}) {
    mtlLoader.load('/Enchanted_Fungal_Gate_0512162655_texture.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
            '/Enchanted_Fungal_Gate_0512162655_texture.obj',
            (object) => {
                object.scale.set(1, 1, 1);
                object.position.set(0, 0, 0);
                object.updateMatrixWorld();
                const boundingBox = new THREE.Box3().setFromObject(object);
                const size = new THREE.Vector3();
                boundingBox.getSize(size);
                const groundOffsetAtGate = getTerrainHeight(object.position.x, object.position.z);
                object.position.y = -boundingBox.min.y + groundOffsetAtGate;
                object.updateMatrixWorld();
                const worldBoundingBox = new THREE.Box3().setFromObject(object);
                const worldCenter = new THREE.Vector3();
                worldBoundingBox.getCenter(worldCenter);
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => { m.roughness = 0.7; m.metalness = 0.1; });
                            } else {
                                child.material.roughness = 0.7;
                                child.material.metalness = 0.1;
                            }
                        }
                    }
                });
                scene.add(object);
                // Portal mesh setup
                const portalWidth = size.x * 0.4;
                const portalHeight = size.y * 0.65;
                const portalGeometry = new THREE.PlaneGeometry(portalWidth, portalHeight);
                const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
                const yOffset = portalHeight * 0.20;
                const zOffset = size.z * 0.1;
                portalMesh.position.set(
                    worldCenter.x,
                    worldCenter.y - yOffset,
                    worldCenter.z - zOffset
                );
                scene.add(portalMesh);
                if (onLoaded) {
                    onLoaded({
                        gateway: object,
                        portalMesh,
                        worldCenter,
                        size,
                        worldBoundingBox
                    });
                }
            },
            undefined,
            (error) => { console.error('An error happened loading the OBJ:', error); }
        );
    },
    undefined,
    (error) => { console.error('An error happened loading the MTL:', error); }
    );
} 
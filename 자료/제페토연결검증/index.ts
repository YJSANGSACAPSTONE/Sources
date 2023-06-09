import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import {Player, sVector3, sQuaternion, SyncTransform, PlayerAdditionalValue, ZepetoAnimationParam} from "ZEPETO.Multiplay.Schema";
import { HttpService } from "ZEPETO.Multiplay.HttpService";

export default class extends Sandbox {
    private sessionIdQueue: string[] = [];
    private InstantiateObjCaches : InstantiateObj[] = [];
    private masterClient = () => this.loadPlayer(this.sessionIdQueue[0]);

    onCreate(options: SandboxOptions) {

        const saveDataToDatabase = async() => {
            const url = "http://ec2-13-124-144-98.ap-northeast-2.compute.amazonaws.com/index.php";
            const data = {
                name :"kim",
                challenge : "1"
            };

            try{
                const request = await HttpService.postAsync(url, data);
                if(request.statusCode!== 200){
                    console.error('HTTP ERROR');
                    return
                }

                const json = JSON.parse(request.response);
            }catch(error){
                console.log(error);
            }

        };

        saveDataToDatabase("kimyuhyeon","wakeup");

        // this.onMessage('save', async (client, message) => {
        //     // const request = await HttpService.getAsync('https://.../%27')
        //     const request = await HttpService.getAsync('http://13.124.226.182:8080/member01/')
        //     if (request.statusCode !== 200) {
        //         console.error('HTTP ERROR');
        //         return;
        //     }

        //     const json = JSON.parse(request.response);
        //     // json 내용 처리
        // });  



        /**Zepeto Player Sync**/
        this.onMessage(MESSAGE.SyncPlayer, (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if(player) {
                /** State **/
                //animation param
                const animationParam = new ZepetoAnimationParam();
                animationParam.State = message.animationParam.State;
                animationParam.MoveState = message.animationParam.MoveState;
                animationParam.JumpState = message.animationParam.JumpState;
                animationParam.LandingState = message.animationParam.LandingState;
                animationParam.MotionSpeed = message.animationParam.MotionSpeed;
                animationParam.FallSpeed = message.animationParam.FallSpeed;
                animationParam.Acceleration = message.animationParam.Acceleration;
                animationParam.MoveProgress = message.animationParam.MoveProgress;
                player.animationParam = animationParam;

                player.gestureName = message.gestureName; // Gesture Sync

                //additional Value
                if (message.playerAdditionalValue != null) {
                    const pAdditionalValue = new PlayerAdditionalValue();
                    pAdditionalValue.additionalWalkSpeed = message.playerAdditionalValue.additionalWalkSpeed;
                    pAdditionalValue.additionalRunSpeed = message.playerAdditionalValue.additionalRunSpeed;
                    pAdditionalValue.additionalJumpPower = message.playerAdditionalValue.additionalJumpPower;
                    player.playerAdditionalValue = pAdditionalValue;
                }
            }
        });

        /**Transform Sync**/
        this.onMessage(MESSAGE.SyncTransform, (client, message) => {
            if (!this.state.SyncTransforms.has(message.Id)) {
                const syncTransform = new SyncTransform();
                this.state.SyncTransforms.set(message.Id.toString(), syncTransform);
            }
            const syncTransform:SyncTransform = this.state.SyncTransforms.get(message.Id);
            if(syncTransform) {
                syncTransform.Id = message.Id;
                syncTransform.position = new sVector3();
                syncTransform.position.x = message.position.x;
                syncTransform.position.y = message.position.y;
                syncTransform.position.z = message.position.z;

                syncTransform.localPosition = new sVector3();
                syncTransform.localPosition.x = message.localPosition.x;
                syncTransform.localPosition.y = message.localPosition.y;
                syncTransform.localPosition.z = message.localPosition.z;

                syncTransform.rotation = new sQuaternion();
                syncTransform.rotation.x = message.rotation.x;
                syncTransform.rotation.y = message.rotation.y;
                syncTransform.rotation.z = message.rotation.z;
                syncTransform.rotation.w = message.rotation.w;

                syncTransform.scale = new sVector3();
                syncTransform.scale.x = message.scale.x;
                syncTransform.scale.y = message.scale.y;
                syncTransform.scale.z = message.scale.z;

                syncTransform.sendTime = message.sendTime;
            }
        });
        this.onMessage(MESSAGE.SyncTransformStatus, (client, message) => {
            const syncTransform:SyncTransform = this.state.SyncTransforms.get(message.Id);
            if(syncTransform)
                syncTransform.status = message.Status;
        });

        this.onMessage(MESSAGE.ChangeOwner, (client,message:string) => {
            this.broadcast(MESSAGE.ChangeOwner+message, client.sessionId);
        });
        this.onMessage(MESSAGE.Instantiate, (client,message:InstantiateObj) => {
            const InstantiateObj: InstantiateObj = {
                Id: message.Id,
                prefabName: message.prefabName,
                ownerSessionId: message.ownerSessionId,
                spawnPosition: message.spawnPosition,
                spawnRotation: message.spawnRotation,
            };
            this.InstantiateObjCaches.push(InstantiateObj);
            this.broadcast(MESSAGE.Instantiate, InstantiateObj);
        });
        this.onMessage(MESSAGE.RequestInstantiateCache, (client) => {
            this.InstantiateObjCaches.forEach((obj)=>{
                client.send(MESSAGE.Instantiate, obj);
            });
        });

        /**SyncDOTween**/
        this.onMessage(MESSAGE.SyncDOTween, (client, message: syncTween) => {
            const tween: syncTween = {
                Id: message.Id,
                position: message.position,
                nextIndex: message.nextIndex,
                loopCount: message.loopCount,
                sendTime: message.sendTime,
            };
            this.broadcast(MESSAGE.ResponsePosition + message.Id, tween, {except: this.masterClient()});
        });

        /**Common**/
        this.onMessage(MESSAGE.CheckServerTimeRequest, (client, message) => {
            let Timestamp = +new Date();
            client.send(MESSAGE.CheckServerTimeResponse, Timestamp);
        });
        this.onMessage(MESSAGE.CheckMaster, (client, message) => {
            console.log(`master->, ${this.sessionIdQueue[0]}`);
            this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
        });
        this.onMessage(MESSAGE.PauseUser, (client) => {
            if(this.sessionIdQueue.includes(client.sessionId)) {
                const pausePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
                this.sessionIdQueue.splice(pausePlayerIndex, 1);
                
                if (pausePlayerIndex == 0) {
                    console.log(`master->, ${this.sessionIdQueue[0]}`);
                    this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
                }
            }
        });
        this.onMessage(MESSAGE.UnPauseUser, (client) => {
            if(!this.sessionIdQueue.includes(client.sessionId)) {
                this.sessionIdQueue.push(client.sessionId);
                this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        });
        
        /** Sample Code **/
        this.onMessage(MESSAGE.BlockEnter, (client,transformId:string) => {
            this.broadcast(MESSAGE.BlockEnter+transformId, client.sessionId);
        });
        this.onMessage(MESSAGE.BlockExit, (client,transformId:string) => {
            this.broadcast(MESSAGE.BlockExit+transformId, client.sessionId);
        });
        this.onMessage(MESSAGE.SendBlockEnterCache, (client,blockCache) => {
            this.loadPlayer(blockCache.newJoinSessionId)?.send(MESSAGE.BlockEnter+blockCache.transformId, client.sessionId);
        });
        
        this.onMessage(MESSAGE.CoinAcquired, (client,transformId:string) => {
            this.masterClient()?.send(MESSAGE.CoinAcquired+transformId, client.sessionId);
        });
        
        /** Racing Game **/
        let isStartGame:boolean = false;
        let startServerTime:number;
        this.onMessage(MESSAGE.StartRunningRequest, (client) => {
            if(!isStartGame) {
                isStartGame = true;
                startServerTime = +new Date();

                this.broadcast(MESSAGE.CountDownStart, startServerTime);
            }
        });
        this.onMessage(MESSAGE.FinishPlayer, (client,finishTime:number) => {
            let playerLapTime = (finishTime-startServerTime)/1000;
            console.log(`${client.sessionId}is enter! ${playerLapTime}`);
            const gameReport: GameReport = {
                playerUserId: client.userId,
                playerLapTime: playerLapTime,
            };
            this.broadcast(MESSAGE.ResponseGameReport, gameReport);
            if(isStartGame) {
                isStartGame = false;
                let gameEndTime:number = +new Date();
                this.broadcast(MESSAGE.FirstPlayerGetIn, gameEndTime);
            }
        });
    }

    onJoin(client: SandboxPlayer) {
        const player = new Player();
        player.sessionId = client.sessionId;
        if (client.hashCode) {
            player.zepetoHash = client.hashCode;
        }
        if (client.userId) {
            player.zepetoUserId = client.userId;
        }
        const players = this.state.players;
        players.set(client.sessionId, player);
        if(!this.sessionIdQueue.includes(client.sessionId)) {
            this.sessionIdQueue.push(client.sessionId.toString());
        }
        console.log(`join player, ${client.sessionId}`);
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        console.log(`leave player, ${client.sessionId}`);

        this.state.players.delete(client.sessionId);
        if(this.sessionIdQueue.includes(client.sessionId)) {
            const leavePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
            this.sessionIdQueue.splice(leavePlayerIndex, 1);
            if (leavePlayerIndex == 0) {
                console.log(`master->, ${this.sessionIdQueue[0]}`);
                this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        }
    }
}

interface syncTween {
    Id: string,
    position: sVector3,
    nextIndex: number,
    loopCount: number,
    sendTime: number,
}

interface InstantiateObj{
    Id:string;
    prefabName:string;
    ownerSessionId?:string;
    spawnPosition?:sVector3;
    spawnRotation?:sQuaternion;
}

/** racing game **/
interface GameReport{
    playerUserId : string;
    playerLapTime : number;
}

enum MESSAGE {
    SyncPlayer = "SyncPlayer",
    SyncTransform = "SyncTransform",
    SyncTransformStatus = "SyncTransformStatus",
    ChangeOwner = "ChangeOwner",
    Instantiate = "Instantiate",
    RequestInstantiateCache = "RequestInstantiateCache",
    ResponsePosition = "ResponsePosition",
    SyncDOTween = "SyncDOTween",
    CheckServerTimeRequest = "CheckServerTimeRequest",
    CheckServerTimeResponse = "CheckServerTimeResponse",
    CheckMaster = "CheckMaster",
    MasterResponse = "MasterResponse",
    PauseUser = "PauseUser",
    UnPauseUser = "UnPauseUser",

    /** Sample Code **/
    BlockEnter = "BlockEnter",
    BlockExit = "BlockExit",
    SendBlockEnterCache = "SendBlockEnterCache",
    CoinAcquired = "CoinAcquired",

    /** Racing Game **/
    StartRunningRequest = "StartRunningRequest",
    FinishPlayer = "FinishPlayer",
    FirstPlayerGetIn = "FirstPlayerGetIn",
    CountDownStart = "CountDownStart",
    ResponseGameReport = "ResponseGameReport"
}


import { NzDrawerRef, NzMessageService, NzModalService } from 'ng-zorro-antd';
import { HttpService } from 'src/app/ng-relax/services/http.service';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DrawerClose } from 'src/app/ng-relax/decorators/drawer/close.decorator';
import { DetailComponent } from './detail/detail.component';

@Component({
  selector: 'app-consumption',
  templateUrl: './consumption.component.html',
  styleUrls: ['./consumption.component.less']
})
export class ConsumptionComponent implements OnInit {

  @Input() memberCardInfo;
  @Input() userInfo;
  @Input() consumptionInfo;
  baseFormGroup: FormGroup;
  timesCountGroup: FormGroup;
  singleTimeGroup: FormGroup;

  teacherList: any[] = [];
  communityList: any[] = [];
  swimRingList: any[] = [];
  memberCardList: any[] = [];
  commoditieListdc: any[] = [];
  commoditieListjc: any[] = [];

  consumptionType: number;

  constructor(
    private http: HttpService,
    private drawerRef: NzDrawerRef<boolean | any>,
    private fb: FormBuilder = new FormBuilder(),
    private message: NzMessageService,
    private modal: NzModalService
  ) { 
   
  }

  ngOnInit() {
    this.memberCardInfo = this.memberCardInfo || this.userInfo || this.consumptionInfo;
    /* ---------------- 根据有无会员卡选择消费方式 ---------------- */
    this.consumptionType = this.memberCardInfo.haveCard == 1 || this.memberCardInfo.cardCode ? 0 : 1;
    
    this.baseFormGroup = this.fb.group({
      reserveId: [this.memberCardInfo.reserveDate ? this.memberCardInfo.id : null],
      memberId: [this.memberCardInfo.memberId || this.memberCardInfo.id],
      name: [{ value: this.memberCardInfo.name, disabled: true }],
      nick: [{ value: this.memberCardInfo.nick, disabled: true }],
      sex: [{ value: this.memberCardInfo.sex, disabled: true }],
      monthAge: [{ value: this.memberCardInfo.monthAge, disabled: true }],
      comment: []
    });
    this.timesCountGroup = this.fb.group({
      cardId: [, [Validators.required]],
      swimTeacherId: [this.memberCardInfo.swimTeacherId, [Validators.required]],
      commodityId: [, [Validators.required]],
      consumption: [, [Validators.required]],
      ringId: [],
      swimDuration: [],
      temperaturePost: [],
      weight: [],
      temperature: [],
      satisfaction: ['一般'],
      consumeDate: [{ value: null, disabled: true }]
    });
    this.singleTimeGroup = this.fb.group({
      cardId: [],
      commodityId: [, [Validators.required]],
      consumption: [, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      swimTeacherId: [this.memberCardInfo.swimTeacherId, [Validators.required]],
      satisfaction: ['一般'],
      consumeDate: [{ value: null, disabled: true }]
    });

    /* ------------------------- 消费服务、商品改变自动填写消费金额 ------------------------- */
    this.timesCountGroup.get('commodityId').valueChanges.subscribe(id => {
      this.http.post('/yeqs/customer/price', { id, cardId: this.timesCountGroup.get('cardId').value }, false).then(res => {
        if(res.code == 1000){
          this.timesCountGroup.patchValue({ consumption: res.result.price });
        }else{
          this.message.create('warning', res.info);
        }
      })
    });


    /* ------------------------- 消费卡改变触发消费服务列表刷新 ------------------------- */
    this.timesCountGroup.get('cardId').valueChanges.subscribe(cardId => {
      this.timesCountGroup.patchValue({ commodityId: null, consumption: null });
      this.http.post('/yeqs/customer/changeCommodity', { cardId }, false).then(res => {
        this.commoditieListjc = res.result;
        this.timesCountGroup.patchValue({ commodityId: res.result[0].id });
      });
    });

    /* ------------------------- 单次消费下消费卡/商品改变触发消费服务列表刷新 ------------------------- */
    this.singleTimeGroup.get('cardId').valueChanges.subscribe(cardId => this.getCommodityPrice());
    this.singleTimeGroup.get('commodityId').valueChanges.subscribe(commodityId => this.getCommodityPrice());

    /* ------------------------- 获取服务器时间 ------------------------- */
    this.http.post('/yeqs/customer/getSystemDate').then(res => {
      this.timesCountGroup.patchValue({ consumeDate: res.result });
      this.singleTimeGroup.patchValue({ consumeDate: res.result });
    });

    /* -------------------- 获取下拉列表数据 -------------------- */
    this.http.post('/yeqs/member/getStoreTeachers').then(res => {
      this.teacherList = res.result;
      if (!this.memberCardInfo.reserveDate) {
        this.timesCountGroup.patchValue({ swimTeacherId: res.result[0].id });
        this.singleTimeGroup.patchValue({ swimTeacherId: res.result[0].id });
      }
    });

    /* -------------------- 如果有会员卡则去请求 会员卡列表和泳圈型号 -------------------- */
    if (this.memberCardInfo.haveCard || this.memberCardInfo.cardCode) {
      this.http.post('/yeqs/memberCard/getMemberCards', { memberId: this.memberCardInfo.memberId || this.memberCardInfo.id }, false).then(res => {
        this.memberCardList = res.result;
        if (res.result.length) {
          this.timesCountGroup.patchValue({ cardId: res.result[0].id });
          this.singleTimeGroup.patchValue({ cardId: res.result[0].id });
          this.http.post('/swimRing/getStoreSwimRings').then(res => this.swimRingList = res.result);
        } else {
          this.consumptionType = 1;
          this.message.error('该客户会员卡(停卡，或过期，或卡次用尽)无法使用，请使用单次消费', { nzDuration: 5000 });
        }
      });
    }

    this.http.post('/commodity/getCommonCommodities').then(res => {
      this.commoditieListdc = res.result;
      /* ------------------------- 判断是否有默认商品 ------------------------- */
      res.result.map(item => item.defaulttag && this.singleTimeGroup.patchValue({ commodityId: item.id }))
    });
  }


  saveLoading: boolean;
  saveDrawer() {
    let baseValue = {};
    Object.keys(this.baseFormGroup.controls).map(key => {
      baseValue[key] = this.baseFormGroup.controls[key].value;
    })
    if (this.consumptionType === 0) {
      if (this.timesCountGroup.invalid) {
        for (let i in this.timesCountGroup.controls) {
          this.timesCountGroup.controls[i].markAsDirty();
          this.timesCountGroup.controls[i].updateValueAndValidity();
        }
      } else {
        this.saveLoading = true;
        this.http.post('/yeqs/customer/create', { paramJson: JSON.stringify(Object.assign(baseValue, this.timesCountGroup.value)), settleStatus: 0 }, true).then(res => {
          this.drawerRef.close(true);
          res.result.id && this.showConsumptionDetail(res.result.id);
        });
      }
    } else {
      if (this.singleTimeGroup.invalid) {
        for (let i in this.singleTimeGroup.controls) {
          this.singleTimeGroup.controls[i].markAsDirty();
          this.singleTimeGroup.controls[i].updateValueAndValidity();
        }
      } else {
        this.saveLoading = true;
        this.http.post('/yeqs/customer/create', { paramJson: JSON.stringify(Object.assign(baseValue, this.singleTimeGroup.value)), settleStatus: 0 }, true).then(res => {
          this.drawerRef.close(true);
          res.result.id && this.showConsumptionDetail(res.result.id);
        });
      }
    }
  }

  showConsumptionDetail(id) {
    this.http.post('/yeqs/customer/viewCardDateils', { id }, false).then(res => {
      if (res.code == 1000) {
        this.modal.create({
          nzTitle: '消费完成',
          nzContent: DetailComponent,
          nzComponentParams: { memberInfo: res.result },
          nzFooter: null
        })
      }
    })
  }

  @DrawerClose() close: () => void;

  getCommodityPrice() {
    var cardId = this.singleTimeGroup.controls['cardId'].value;
    var commodityId = this.singleTimeGroup.controls['commodityId'].value;
    this.http.post('/customer/getCommodityPrice', { cardId, commodityId }, false).then(res => {
      res.code == 1000 && this.singleTimeGroup.patchValue({ consumption: res.result.price });
    })
  }

}

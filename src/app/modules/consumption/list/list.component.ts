import { Component, OnInit, ViewChild , TemplateRef , ComponentRef} from '@angular/core';
import { ListPageComponent } from 'src/app/ng-relax/components/list-page/list-page.component';
import { QueryNode } from 'src/app/ng-relax/components/query/query.component';
import { PreviewComponent } from './preview/preview.component';
import { SatisfactionComponent } from './satisfaction/satisfaction.component';
import { RevokeComponent } from './revoke/revoke.component';
import { MessageComponent } from './message/message.component';
import { CurriculumComponent } from './curriculum/curriculum.component';
import { HttpService } from 'src/app/ng-relax/services/http.service';
import { NzMessageService, NzDrawerService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.less']
})
export class ListComponent implements OnInit {

  @ViewChild('listPage') listPage: ListPageComponent;
  componentRef: ComponentRef<any>;
  baseFormGroup: FormGroup;
  drawerTitle: string;
  teacherList: any;
  showDrawer: boolean = false;
  queryNode: QueryNode[] = [
    {
      label       : '会员卡号',
      key         : 'cardCode',
      type        : 'input'
    },
    {
      label       : '会员姓名',
      key         : 'memberName',
      type        : 'input'
    },
    {
      label       : '会员ID',
      key         : 'memberId',
      type        : 'input'
    },
    {
      label       : '会员小名',
      key         : 'nick',
      type        : 'input',
      isHide      : true
    },
    {
      label       : '服务泳师',
      key         : 'teacherId',
      type        : 'select',
      optionsUrl  : '/member/getStoreTeachers'
    },
    {
      label       : '婴儿类型',
      key         : 'babyType',
      type        : 'select',
      options     : [ { name: '婴儿', id: '婴儿' }, { name: '幼儿', id: '幼儿' } ],
      isHide      : true
    },
    {
      label       : '消费商品',
      key         : 'commodityId',
      type        : 'select',
      optionsUrl  : '/commodity/getStoreCommodities',
      isHide      : true 
    },
    {
      label       : '业务类型',
      key         : 'categoryId',
      type        : 'select',
      optionsUrl  : '/cardBusinessManagement/getStoreCardTypeCategores',
      isHide      : true
    },
    {
      label       : '卡类型',
      key         : 'cardTypeId',
      type        : 'select',
      optionsUrl  : '/cardTypeManagement/findList',
      isHide      : true
    },
    {
      label       : '满意度',
      key         : 'satisfaction',
      type        : 'select',
      options     : [ { name: '满意', id: '满意' }, { name: '表扬', id: '表扬' }, { name: '一般', id: '一般' }, { name: '不好', id: '不好' } ],
      isHide      : true
    },
    {
      label       : '消费日期',
      key         : 'date',
      valueKey    : ['startDate', 'endDate'],
      type        : 'rangepicker'
    }
  ]

  operationComponents = {
    preview: {
      title: '查看消费记录',
      component: PreviewComponent
    },
    satisfaction: {
      title: '修改满意度',
      component: SatisfactionComponent
    },
    revoke: {
      title: '撤销消费',
      component: RevokeComponent
    },
    message: {
      title: '发短信',
      component: MessageComponent
    },
    curriculum: {
      title: '添加课程',
      component: CurriculumComponent
    }
  };

  checkedItems: any[] = [];

  constructor(
    private http: HttpService,
    private message: NzMessageService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder = new FormBuilder(),
    private drawer: NzDrawerService
    ) { 
      this.http.post('/tongka/teacherList', {}, false).then(res => this.teacherList = res.result);   
    }

  private getQueryParams;
  ngOnInit() {
      
    this.baseFormGroup = this.fb.group({
      consumeId: [],
      swimTeacherId: [ ,[Validators.required]],
      assisTeacherId: [ ,[Validators.required]],
      showerTeacherId: [],
      fitnessTeacherId: [],
    });

    this.activatedRoute.queryParamMap.subscribe((res: any) => {
      if (res.params.memberId) {
        this.getQueryParams = res.params;
        setTimeout(() => {
          this.listPage.eaQuery._queryForm.patchValue(this.getQueryParams);
        });
      }
    })
  }

  requestReady(e) {
    this.getQueryParams && this.listPage.eaTable.request(this.getQueryParams);
  }
  operation(type) {
    if (!this.checkedItems.length) {
      this.message.warning('请选择一条数据进行操作');
    } else {
      let recordInfo = this.listPage.eaTable.dataSet.filter(res => res.id === this.checkedItems[0])[0];
      const drawer = this.drawer.create({
        nzTitle: this.operationComponents[type].title,
        nzWidth: 720,
        nzContent: this.operationComponents[type].component,
        nzContentParams: { id: recordInfo.id, recordInfo }
      });
      drawer.afterClose.subscribe(res => res && this.listPage.eaTable._request());
    }
  }
  saveLoading: boolean;
  saveDrawer() {
    this.saveLoading = true;
    this.componentRef.instance.save().then(res => {
      this.saveLoading = false;
      if (res) {
        this.showDrawer = false;
        this.listPage.eaTable._request();
      }
    });
  }
  @ViewChild('drawerTemplate') drawerTemplate: TemplateRef<any>;
  teacherDetail(data){
    this.baseFormGroup.patchValue({consumeId: data.id});
    this.baseFormGroup.patchValue({swimTeacherId: data.teacherId});
    this.baseFormGroup.patchValue({assisTeacherId: data.assisTeacherId});
    this.baseFormGroup.patchValue({showerTeacherId: data.showerTeacherId});
    this.baseFormGroup.patchValue({fitnessTeacherId: data.fitnessTeacherId});   
    this.baseFormGroup.patchValue({leaveStatus: data.leaveStatus});  
    this.drawer.create({
        nzTitle: '授课老师',
        nzWidth: 700,
        nzContent: this.drawerTemplate
      });
  }
  saveLoadingx: boolean;
  save(drawerRef){
    if (this.baseFormGroup.invalid) {
    for (let i in this.baseFormGroup.controls) {
      this.baseFormGroup.controls[i].markAsDirty();
      this.baseFormGroup.controls[i].updateValueAndValidity();
    }
  }else{
    this.saveLoadingx = true;
    this.http.post('/yeqs/customer/updateTeacher', { paramJson: JSON.stringify(this.baseFormGroup.value) }).then(res => {
      this.saveLoadingx = false;
      drawerRef.close();
      this.listPage.eaTable.request(this.getQueryParams);
    }).catch();
  }
}

}

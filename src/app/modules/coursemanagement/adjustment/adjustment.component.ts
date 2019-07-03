import { FormControl, FormGroup } from '@angular/forms';
import { HttpService } from 'src/app/ng-relax/services/http.service';
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-adjustment',
  templateUrl: './adjustment.component.html',
  styleUrls: ['./adjustment.component.scss']
})
export class AdjustmentComponent implements OnInit {
  private domain = environment.domainYeqs;
  courseList: any = [];
  allChecked = false;
  indeterminate = false;
  dateName:any = [];
  displayData = [];
  iscourse: any = ''; 
  isVisible  = false;
  isAdjust = false;
  removeId:any = [];
  ClassroomList = [];
  selectScourList = [];
  tcTit:any = '课程进度调整';
  ctadjustmentList:any =  [];
  adjustmentList: any = [
    {
      roomName:'',
      employeeName:'',
      currentDate:''
    }
  ];
  data = [
    
  ];
  constructor(
    private http: HttpService,
    private message: NzMessageService,
    private format: DatePipe,

  ) { 
    this.selectEmployee();
    this.selectClassroom();
  }
  currentPageDataChange($event: Array<{ name: string; age: number; address: string; checked: boolean; disabled: boolean; }>): void {
    this.displayData = $event;
    //this.refreshStatus('all','all');
  }

  refreshStatus(data,checked): void {
    const allChecked = this.displayData.filter(value => !value.disabled).every(value => value.checked === true);
    const allUnChecked = this.displayData.filter(value => !value.disabled).every(value => !value.checked);
    this.allChecked = allChecked;
    this.indeterminate = (!allChecked) && (!allUnChecked);
    if (checked && checked!='all'){
      this.removeId.push(data);
    }else if(!checked){
      this.removeId.map( (item,index)=>{
        if(item.id == data.id){
          this.removeId.splice(index,1);
        }
      })  
    }else if(data == true){
      this.removeId = [];  
      this.data.map(item=>{
          this.removeId.push(item);
        }) 
    } else if (data == false){
      this.removeId = [];
    }
  }

  checkAll(value: boolean): void {
    this.displayData.forEach(data => {
      if (!data.disabled) {
        data.checked = value;
      }
    });
    this.refreshStatus(value,'all');
  }
  selectEmployee() {
    let that = this;
    that.http.post(this.domain + '/scheduling/selectSyllabusAll', {}, false).then(res => {
      if (res.code == 1000) {
        that.courseList = res.result.list;
      }
    });
  };
  querySelect(){
    if (!this.iscourse) {
      this.message.create('error', `请选择课程名称`);
      return false;
    }  
    if (!this.dateName.length){
      this.message.create('error', `请选择日期！`);  
      return false;
    }
  
    let paramJson: any = JSON.stringify({
      startDate: this.format.transform(this.dateName[0], 'yyyy-MM-dd'),
      endDate: this.format.transform(this.dateName[1], 'yyyy-MM-dd'),
      syllabusName: this.iscourse
      //syllabusName: '海马二阶'
    });
    this.http.post(this.domain + '/curriculum/selectReserveRecord', { paramJson }, false).then(res => {
      if (res.code == 1000) {
        this.data = res.result.list;
        this.removeId = [];
      }
    });       
  };
  showModal() {
    if (this.removeId.length){
      this.isVisible = true;
    }else{
      this.message.create('error', `请选择一条数据！`);
    }
    
  };
  handleOk(){
    let checkedId = "";
    let isfalse = false;
    this.removeId.map((item, index) => {
      if (item.classNumber != 0) {
        isfalse = true;
        return false;
      }
      if (index != this.removeId.length - 1) {
        checkedId += item.id + ','
      } else {
        checkedId += item.id
      }
    })
    if (isfalse) {
      this.message.create('error', `已排课课程不能删除！`);
      return false;
    }
    this.http.post(this.domain + '/curriculum/deleteReserve', { checkedId }, false).then(res => {
      if (res.code == 1000) {
        this.message.create('success', `删除成功！`);
        this.isVisible = false;
        this.querySelect();
      }else{
        this.message.create('error', res.info);
      }
    });
    
  }

  handleCancel(): void {
    this.isVisible = false;
  }
  adjustment(){
    if (!this.removeId.length) {
      this.message.create('error', `请选择一条数据！`);
      return false;
    }
    this.adjustmentList = [];
    let checkedId = "";
    this.ctadjustmentList =[];
    this.tcTit = '课程进度调整';
    let isfalse = false;
    this.removeId.map((item, index) => {
      if (item.classNumber!=0){
          isfalse = true;
        return false;
      }
      if (index != this.removeId.length - 1) {
        checkedId += item.id + ','
      } else {
        checkedId += item.id
      }
    })  
    if (isfalse){
      this.message.create('error', `已排课课程不能调整进度！`);
      return false;
    }
    this.http.post(this.domain + '/curriculum/selectAllReserve', { checkedId }, false).then(res => {
      if (res.code == 1000) {
        this.adjustmentList = res.result.list;
      }
    }); 
    this.isAdjust = true;
  }

  hideAdjust(){
    this.isAdjust = false;
    
  }
  //确认调课
  AdjustOk(){
    this.adjustmentList.map(item=>{
      item.currentDate = this.format.transform(item.currentDate, 'yyyy-MM-dd');
    })
    let paramJson: any = JSON.stringify(this.adjustmentList);
    this.http.post(this.domain + '/curriculum/checkReserve', { paramJson }, false).then(res => {
      if (res.code == 1000) {
        if(res.result){
      
          this.message.create('error', '排课冲突，请调整后再试！');
          this.tcTit = "课程冲突，请调整";
          this.ctadjustmentList = res.result.list;
        }else{
          this.message.create('success', '操作成功！');
          this.isAdjust = false;
          this.adjustmentList = [];
          this.querySelect();
          this.removeId = [];
        }
      }
    });  
     
  }
  //查询教室列表and 查询时间列表
  selectClassroom(){
    this.http.post(this.domain + '/scheduling/selectSchedulingAll', { }, false).then(res => {
      if (res.code == 1000) {
        this.ClassroomList = res.result.list;
      }
    });   

    this.http.post(this.domain + '/intelligent/selectScour', {}, false).then(res => {
    if (res.code == 1000) {
      this.selectScourList = res.result.list;
    }
  });  
  };
  //课表调整改变教室
  schoolSelect(index){
    this.ClassroomList.map( item=>{
      if (this.adjustmentList[index].roomName == item.roomName){
        this.adjustmentList[index].employeeName = item.employeeName;
      }
    })
  };

  

  ngOnInit() {
  }


}

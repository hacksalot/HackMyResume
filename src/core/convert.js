/**
FRESH to JSON Resume conversion routiens.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk
*/

(function(){

  /**
  Convert between FRESH and JRS resume/CV formats.
  @class FRESHConverter
  */
  var FRESHConverter = module.exports = {


    /**
    Convert from JSON Resume format to FRESH.
    */
    toFRESH: function( jrs ) {

      return {

        name: jrs.basics.name,

        info: {
          label: jrs.basics.label,
          //class: jrs.basics.label,
          image: jrs.basics.picture,
          brief: jrs.basics.summary
        },

        contact: {
          email: jrs.basics.email,
          phone: jrs.basics.phone,
          website: jrs.basics.website
          //other: [none]
        },

        meta: jrs.meta,

        // disposition: {
        //   travel: 25,
        //   relocation: true,
        //   authorization: "citizen",
        //   commitment: ["full-time","permanent","contract"],
        //   remote: true,
        //   relocation: {
        //     willing: true,
        //     destinations: [ "Austin, TX", "California", "New York" ]
        //   }
        // },

        location: {
          city: jrs.basics.location.city,
          region: jrs.basics.location.region,
          country: jrs.basics.location.countryCode,
          code: jrs.basics.location.postalCode,
          address: jrs.basics.location.address
        },

        employment: {
          history: jrs.work.map( function( job ) {
            return {
              position: job.position,
              employer: job.company,
              summary: job.summary,
              current: !job.endDate || !job.endDate.trim() || job.endDate.trim().toLowerCase() === 'current',
              start: job.startDate,
              end: job.endDate,
              url: job.website,
              keywords: "",
              highlights: job.highlights
            };
          })
        },

        education: {
          history: jrs.education.map(function(edu){
            return {
              institution: edu.institution,
              start: edu.startDate,
              end: edu.endDate,
              grade: edu.gpa,
              curriculum: edu.courses,
              url: edu.website || edu.url || null,
              summary: null,
              area: edu.area,
              studyType: edu.studyType
            };
          })
        },

        service: {
          history: jrs.volunteer.map(function(vol) {
            return {
              type: 'volunteer',
              position: vol.position,
              organization: vol.organization,
              start: vol.startDate,
              end: vol.endDate,
              url: vol.website,
              summary: vol.summary,
              highlights: vol.highlights
            };
          })
        },

        skills: skillsToFRESH( jrs.skills ),

        writing: jrs.publications.map(function(pub){
          return {
            title: pub.name,
            publisher: pub.publisher,
            link: [
              { 'url': pub.website }
            ],
            year: pub.releaseDate,
            date: pub.releaseDate,
            summary: pub.summary
          };
        }),

        recognition: jrs.awards.map(function(awd){
          return {
            title: awd.title,
            date: awd.date,
            summary: awd.summary,
            from: awd.awarder,
            url: null
          };
        }),

        social: jrs.basics.profiles.map(function(pro){
          return {
            label: pro.network,
            network: pro.network,
            url: pro.url,
            user: pro.username
          };
        }),

        interests: jrs.interests,

        references: jrs.references,

        languages: jrs.languages
      };
    },

    /**
    Convert from FRESH format to JSON Resume.
    */
    toJRS: function( fresh ) {

      return {

        basics: {
          name: fresh.name,
          label: fresh.info.label,
          summary: fresh.info.brief,
          website: fresh.contact.website,
          phone: fresh.contact.phone,
          email: fresh.contact.email,
          picture: fresh.info.image,
          location: {
            address: fresh.location.address,
            postalCode: fresh.location.code,
            city: fresh.location.city,
            countryCode: fresh.location.country,
            region: fresh.location.region
          },
          profiles: fresh.social.map(function(soc){
            return {
              network: soc.network,
              username: soc.user,
              url: soc.url
            };
          })
        },

        work: fresh.employment.history.map(function(emp){
          return {
            company: emp.employer,
            website: emp.url,
            position: emp.position,
            startDate: emp.start,
            endDate: emp.end,
            summary: emp.summary,
            highlights: emp.highlights
          };
        }),

        education: fresh.education.history.map(function(edu){
          return {
            institution: edu.institution,
            gpa: edu.grade,
            courses: edu.curriculum,
            startDate: edu.start,
            endDate: edu.end,
            area: edu.area,
            studyType: edu.studyType
          };
        }),

        skills: skillsToJRS( fresh.skills ),

        volunteer: fresh.service.history.map(function(srv){
          return {
            //???: srv.type,
            organization: srv.organization,
            position: srv.position,
            startDate: srv.start,
            endDate: srv.end,
            website: srv.url,
            summary: srv.summary,
            highlights: srv.highlights
          };
        }),

        awards: fresh.recognition.map(function(awd){
          return {
            //???: awd.type, // TODO
            //???: awd.url,
            title: awd.title,
            date: awd.date,
            awarder: awd.from,
            summary: awd.summary
          };
        }),

        publications: fresh.writing.map(function(pub){
          return {
            name: pub.title,
            publisher: pub.publisher,
            releaseDate: pub.date,
            website: pub.link[0].url,
            summary: pub.summary
          };
        }),

        interests: fresh.interests,

        references: fresh.references,

        languages: fresh.languages

      };

    }

  };

  function skillsToFRESH( skills ) {

    return {
      sets: skills.map(function(set) {
        return {
          name: set.name,
          level: set.level,
          skills: set.keywords
        };
      })
    };
  }

  function skillsToJRS( skills ) {
    var ret = [];
    if( skills.sets && skills.sets.length ) {
      ret = skills.sets.map(function(set){
        return {
          name: set.name,
          level: set.level,
          keywords: set.skills
        };
      });
    }
    else if( skills.list ) {
      ret = skills.list.map(function(sk){
        return {
          name: sk.name,
          level: sk.level,
          keywords: sk.keywords
        };
      });
    }
    return ret;
  }



}());
